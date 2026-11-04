const {
  createRateLimit,
  normalizeEmailIdentifier,
} = require("./rateLimit.middleware")
const { getLoginAudience } = require("../utils/loginAudience")

const adminRateLimit = createRateLimit({
  name: "admin-login",
  limit: 5,
  window: "15 m",
  identifier: (req) =>
    `${req.ip || req.socket.remoteAddress || "unknown"}:${normalizeEmailIdentifier(req)}`,
})

const adminLoginRateLimit = (req, res, next) => {
  if (getLoginAudience(req) !== "admin") {
    return next()
  }

  return adminRateLimit(req, res, next)
}

module.exports = adminLoginRateLimit
