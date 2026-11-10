const assert = require("assert");
const mongoose = require("mongoose");
const User = require("../src/models/user.model");
const Password = require("../src/models/store.model");
const {
  MAX_VAULT_ENTRIES,
  ensureVaultEntryCount,
  reserveVaultEntrySlot,
  releaseVaultEntrySlot,
} = require("../src/utils/vaultEntryLimit");

const createQuery = (result) => ({
  select() {
    return this;
  },
  session() {
    return this;
  },
  lean: async () => result,
});

async function runTests() {
  const counts = new Map();
  const legacyCounts = new Map();

  User.findById = (userId) => createQuery(
    counts.has(String(userId))
      ? { vaultEntryCount: counts.get(String(userId)) }
      : {}
  );
  User.updateOne = async (filter, update) => {
    const userId = String(filter._id);
    if (update.$set) {
      if (counts.has(userId)) return { modifiedCount: 0 };
      counts.set(userId, update.$set.vaultEntryCount);
      return { modifiedCount: 1 };
    }

    const currentCount = counts.get(userId);
    if (
      currentCount === undefined ||
      (filter.vaultEntryCount?.$lt !== undefined &&
        currentCount >= filter.vaultEntryCount.$lt) ||
      (filter.vaultEntryCount?.$gt !== undefined &&
        currentCount <= filter.vaultEntryCount.$gt)
    ) {
      return { modifiedCount: 0 };
    }

    counts.set(userId, currentCount + update.$inc.vaultEntryCount);
    return { modifiedCount: 1 };
  };
  Password.countDocuments = (filter) => ({
    session: async () => legacyCounts.get(String(filter.userId)) || 0,
  });

  const session = {};
  const legacyUserId = new mongoose.Types.ObjectId().toString();
  counts.delete(legacyUserId);
  legacyCounts.set(legacyUserId, MAX_VAULT_ENTRIES - 1);
  await reserveVaultEntrySlot(legacyUserId, session);
  assert.equal(counts.get(legacyUserId), MAX_VAULT_ENTRIES);
  await assert.rejects(
    reserveVaultEntrySlot(legacyUserId, session),
    (error) => error.code === "VAULT_LIMIT_REACHED"
  );

  const concurrentUserId = new mongoose.Types.ObjectId().toString();
  counts.set(concurrentUserId, MAX_VAULT_ENTRIES - 1);
  const concurrentResults = await Promise.allSettled([
    reserveVaultEntrySlot(concurrentUserId, session),
    reserveVaultEntrySlot(concurrentUserId, session),
  ]);
  assert.equal(concurrentResults.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(counts.get(concurrentUserId), MAX_VAULT_ENTRIES);

  const overLimitLegacyUserId = new mongoose.Types.ObjectId().toString();
  legacyCounts.set(overLimitLegacyUserId, MAX_VAULT_ENTRIES + 2);
  await assert.rejects(
    reserveVaultEntrySlot(overLimitLegacyUserId, session),
    (error) => error.code === "VAULT_LIMIT_REACHED"
  );
  assert.equal(counts.get(overLimitLegacyUserId), MAX_VAULT_ENTRIES + 2);

  const userWithDeletableEntryId = new mongoose.Types.ObjectId().toString();
  legacyCounts.set(userWithDeletableEntryId, 1);
  await ensureVaultEntryCount(userWithDeletableEntryId, session);
  await releaseVaultEntrySlot(userWithDeletableEntryId, session);
  assert.equal(counts.get(userWithDeletableEntryId), 0);

  console.log("✔ Vault entry counter enforces the limit, legacy migration, concurrency, and release.");
}

runTests().catch((error) => {
  console.error("Vault entry limit test failed:", error);
  process.exitCode = 1;
});
