const VaultKey = require("../models/vaultKey.model");
const { unwrapDek } = require("./encryption");

const getUserVaultKey = async (userId) => {
  const keyRecord = await VaultKey.findOne({ userId })
    .select("wrappedDek iv authTag keyVersion")
    .lean();

  if (!keyRecord) {
    const error = new Error("Vault key record is missing.");
    error.code = "VAULT_KEY_NOT_FOUND";
    throw error;
  }

  if (keyRecord.keyVersion !== 1) {
    const error = new Error("Vault key version is not supported.");
    error.code = "VAULT_KEY_VERSION_UNSUPPORTED";
    throw error;
  }

  return unwrapDek(
    keyRecord.wrappedDek,
    keyRecord.iv,
    keyRecord.authTag
  );
};

module.exports = getUserVaultKey;
