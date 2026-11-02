const normalizeOrigins = (value) => (value || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => new URL(origin).origin);

const getLoginAudience = (req, env = process.env) => {
  const requestOrigin = req.get("origin");
  let origin = requestOrigin;

  if (!origin) {
    const referer = req.get("referer");
    if (referer) {
      try {
        origin = new URL(referer).origin;
      } catch {
        return null;
      }
    }
  }

  if (!origin) return null;

  let normalizedOrigin;
  try {
    normalizedOrigin = new URL(origin).origin;
  } catch {
    return null;
  }

  const adminOrigins = normalizeOrigins(env.ADMIN_URL);
  if (adminOrigins.includes(normalizedOrigin)) return "admin";

  const clientOrigins = normalizeOrigins(env.CLIENT_URL || "http://localhost:5173");
  if (env.NODE_ENV !== "production") {
    clientOrigins.push("http://localhost:3000", "http://localhost:5173");
  }
  if (clientOrigins.includes(normalizedOrigin)) return "user";

  return null;
};

const hasOverlappingLoginOrigins = (env = process.env) => {
  const clientOrigins = normalizeOrigins(env.CLIENT_URL || "http://localhost:5173");
  const adminOrigins = normalizeOrigins(env.ADMIN_URL);
  return adminOrigins.some((origin) => clientOrigins.includes(origin));
};

module.exports = {
  getLoginAudience,
  hasOverlappingLoginOrigins,
};
