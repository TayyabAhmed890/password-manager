const crypto = require("crypto");
const { getRedisClient } = require("../middlewares/rateLimit.middleware");

const CACHE_TTL_SECONDS = 60;
const CACHE_PREFIX = "password-manager:vault-cache:v1";

const getUserCachePrefix = (userId) => {
  const userHash = crypto
    .createHash("sha256")
    .update(String(userId))
    .digest("hex");

  return `${CACHE_PREFIX}:${userHash}`;
};

const readCache = async (key) => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  try {
    return await getRedisClient().get(key);
  } catch (error) {
    console.warn("[vault-cache] Redis read failed; using MongoDB.", error.name || "Error");
    return null;
  }
};

const writeCache = async (key, value) => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return;
  }

  try {
    await getRedisClient().set(key, value, { ex: CACHE_TTL_SECONDS });
  } catch (error) {
    console.warn("[vault-cache] Redis write failed.", error.name || "Error");
  }
};

const getCachedVaultList = (userId) =>
  readCache(`${getUserCachePrefix(userId)}:list`);

const cacheVaultList = (userId, entries) =>
  writeCache(`${getUserCachePrefix(userId)}:list`, entries);

const getCachedPassword = (userId, entryId) =>
  readCache(`${getUserCachePrefix(userId)}:entry:${entryId}`);

const cachePassword = (userId, entryId, encryptedEntry) =>
  writeCache(
    `${getUserCachePrefix(userId)}:entry:${entryId}`,
    encryptedEntry
  );

const invalidateVaultCache = async (userId, entryId) => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return;
  }

  const keys = [`${getUserCachePrefix(userId)}:list`];
  if (entryId) {
    keys.push(`${getUserCachePrefix(userId)}:entry:${entryId}`);
  }

  try {
    await getRedisClient().del(...keys);
  } catch (error) {
    console.warn("[vault-cache] Redis invalidation failed.", error.name || "Error");
  }
};

module.exports = {
  cachePassword,
  cacheVaultList,
  getCachedPassword,
  getCachedVaultList,
  invalidateVaultCache,
};
