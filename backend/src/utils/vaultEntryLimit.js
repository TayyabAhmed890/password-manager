const User = require("../models/user.model");
const Password = require("../models/store.model");

const MAX_VAULT_ENTRIES = 10;

const createVaultLimitError = () => {
  const error = new Error("Vault entry limit reached.");
  error.code = "VAULT_LIMIT_REACHED";
  return error;
};

const isValidCount = (count) =>
  Number.isSafeInteger(count) && count >= 0;

const ensureVaultEntryCount = async (userId, session) => {
  let user = await User.findById(userId)
    .select("vaultEntryCount")
    .session(session)
    .lean();

  if (!user) {
    const error = new Error("Vault owner no longer exists.");
    error.code = "VAULT_OWNER_NOT_FOUND";
    throw error;
  }

  if (isValidCount(user.vaultEntryCount)) {
    return user.vaultEntryCount;
  }

  const count = await Password.countDocuments({ userId }).session(session);
  const result = await User.updateOne(
    { _id: userId, vaultEntryCount: { $exists: false } },
    { $set: { vaultEntryCount: count } },
    { session }
  );

  if (result.modifiedCount === 1) {
    return count;
  }

  user = await User.findById(userId)
    .select("vaultEntryCount")
    .session(session)
    .lean();

  if (!user || !isValidCount(user.vaultEntryCount)) {
    const error = new Error("Vault entry count could not be initialized.");
    error.code = "VAULT_COUNTER_INVALID";
    throw error;
  }

  return user.vaultEntryCount;
};

const reserveVaultEntrySlot = async (userId, session) => {
  const count = await ensureVaultEntryCount(userId, session);
  if (count >= MAX_VAULT_ENTRIES) {
    throw createVaultLimitError();
  }

  const result = await User.updateOne(
    { _id: userId, vaultEntryCount: { $lt: MAX_VAULT_ENTRIES } },
    { $inc: { vaultEntryCount: 1 } },
    { session }
  );

  if (result.modifiedCount !== 1) {
    throw createVaultLimitError();
  }
};

const releaseVaultEntrySlot = async (userId, session) => {
  await ensureVaultEntryCount(userId, session);
  const result = await User.updateOne(
    { _id: userId, vaultEntryCount: { $gt: 0 } },
    { $inc: { vaultEntryCount: -1 } },
    { session }
  );

  if (result.modifiedCount !== 1) {
    const error = new Error("Vault entry count is inconsistent.");
    error.code = "VAULT_COUNTER_INVALID";
    throw error;
  }
};

module.exports = {
  MAX_VAULT_ENTRIES,
  ensureVaultEntryCount,
  reserveVaultEntrySlot,
  releaseVaultEntrySlot,
};
