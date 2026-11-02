const crypto = require("crypto");
const { Redis } = require("@upstash/redis");
const { Ratelimit } = require("@upstash/ratelimit");

const limiters = new Map();
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

const createRateLimit = ({
  name,
  limit,
  window,
  identifier = (req) => req.ip || req.socket.remoteAddress || "unknown",
}) => async (req, res, next) => {
  try {
    const limiter = getRateLimiter({ name, limit, window });
    const identifierValue = identifier(req);
    const key = crypto
      .createHash("sha256")
      .update(`${name}:${identifierValue}`)
      .digest("hex");
    const result = await limiter.limit(key);

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
  normalizeEmailIdentifier,
};
