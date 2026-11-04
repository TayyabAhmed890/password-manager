const crypto = require("crypto");
const { Redis } = require("@upstash/redis");
const { Ratelimit } = require("@upstash/ratelimit");

const limiters = new Map();
const localBuckets = new Map();
let redisClient;

const getRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Upstash Redis configuration is missing.");
  }

  redisClient ||= new Redis({ url, token });
  return redisClient;
};

const getRateLimiter = ({ name, limit, window }) => {
  const cacheKey = `${name}:${limit}:${window}`;

  if (!limiters.has(cacheKey)) {
    limiters.set(
      cacheKey,
      new Ratelimit({
        redis: getRedisClient(),
        limiter: Ratelimit.slidingWindow(limit, window),
        prefix: `password-manager:${name}`,
      })
    );
  }

  return limiters.get(cacheKey);
};

const getWindowMs = (window) => {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(window);
  if (!match) {
    throw new Error("Unsupported rate-limit window.");
  }

  const units = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(match[1]) * units[match[2].toLowerCase()];
};

const consumeLocalLimit = ({ name, key, limit, window }) => {
  const now = Date.now();
  const windowMs = getWindowMs(window);
  const bucketKey = `${name}:${key}`;
  const bucket = localBuckets.get(bucketKey) || { hits: [], expiresAt: now + windowMs };
  const validHits = bucket.hits
    .filter((timestamp) => timestamp > now - windowMs);
  const success = validHits.length < limit;

  if (success) {
    validHits.push(now);
  }
  localBuckets.set(bucketKey, { hits: validHits, expiresAt: now + windowMs });

  if (localBuckets.size > 10_000) {
    for (const [storedKey, storedBucket] of localBuckets) {
      if (storedBucket.expiresAt <= now) {
        localBuckets.delete(storedKey);
      }
    }
    if (localBuckets.size > 10_000) {
      localBuckets.delete(localBuckets.keys().next().value);
    }
  }

  const reset = validHits[0] + windowMs;
  return {
    success,
    limit,
    remaining: Math.max(0, limit - validHits.length),
    reset,
  };
};

const createRateLimit = ({
  name,
  limit,
  window,
  identifier = (req) => req.ip || req.socket.remoteAddress || "unknown",
}) => async (req, res, next) => {
  try {
    const identifierValue = identifier(req);
    const key = crypto
      .createHash("sha256")
      .update(`${name}:${identifierValue}`)
      .digest("hex");
    let result;
    const hasRedisConfig = process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!hasRedisConfig && process.env.NODE_ENV !== "production") {
      result = consumeLocalLimit({ name, key, limit, window });
    } else {
      try {
        result = await getRateLimiter({ name, limit, window }).limit(key);
      } catch (error) {
        if (process.env.NODE_ENV === "production") {
          throw error;
        }

        console.warn("Rate-limit service unavailable; using process-local limits.");
        result = consumeLocalLimit({ name, key, limit, window });
      }
    }

    res.set("RateLimit-Limit", String(result.limit));
    res.set("RateLimit-Remaining", String(result.remaining));
    res.set(
      "RateLimit-Reset",
      String(Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)))
    );

    if (!result.success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000)
      );

      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }

    return next();
  } catch (error) {
    console.error(
      "Rate-limit service unavailable:",
      error.name || "Error"
    );
    return res.status(503).json({
      success: false,
      message: "Service temporarily unavailable.",
    });
  }
};

const normalizeEmailIdentifier = (req) =>
  typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "missing-email";

module.exports = {
  createRateLimit,
  getRedisClient,
  consumeLocalLimit,
  normalizeEmailIdentifier,
};
