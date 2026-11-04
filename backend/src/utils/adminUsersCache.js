const { getRedisClient } = require("../middlewares/rateLimit.middleware")

const CACHE_TTL_SECONDS = 30
const CACHE_VERSION_KEY = "password-manager:admin-users:v1:version"
const CACHE_PREFIX = "password-manager:admin-users:v1"

const isConfigured = () =>
  Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

const getAdminUsersCacheKey = async (page, limit) => {
  if (!isConfigured()) return null

  try {
    const version = (await getRedisClient().get(CACHE_VERSION_KEY)) ?? 0
    return `${CACHE_PREFIX}:${version}:${page}:${limit}`
  } catch (error) {
    console.warn("[admin-users-cache] Redis read failed; using MongoDB.", error.name || "Error")
    return null
  }
}

const readAdminUsersCache = async (key) => {
  if (!key) return null

  try {
    return await getRedisClient().get(key)
  } catch (error) {
    console.warn("[admin-users-cache] Redis read failed; using MongoDB.", error.name || "Error")
    return null
  }
}

const writeAdminUsersCache = async (key, value) => {
  if (!key) return

  try {
    await getRedisClient().set(key, value, { ex: CACHE_TTL_SECONDS })
  } catch (error) {
    console.warn("[admin-users-cache] Redis write failed.", error.name || "Error")
  }
}

const invalidateAdminUsersCache = async () => {
  if (!isConfigured()) return

  try {
    await getRedisClient().incr(CACHE_VERSION_KEY)
  } catch (error) {
    console.warn("[admin-users-cache] Redis invalidation failed.", error.name || "Error")
  }
}

module.exports = {
  CACHE_TTL_SECONDS,
  getAdminUsersCacheKey,
  invalidateAdminUsersCache,
  readAdminUsersCache,
  writeAdminUsersCache,
}
