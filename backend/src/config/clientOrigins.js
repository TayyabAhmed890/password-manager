const getClientOrigins = (env = process.env) => {
  const configuredOrigins = [
    ...(env.CLIENT_URL || "http://localhost:5173").split(","),
    ...(env.ADMIN_URL ? env.ADMIN_URL.split(",") : []),
  ]
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((value) => {
      const url = new URL(value);

      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      ) {
        throw new Error("CLIENT_URL and ADMIN_URL must be HTTP(S) origins without paths.");
      }

      return url.origin;
    });

  if (env.NODE_ENV !== "production") {
    configuredOrigins.push("http://localhost:5173", "http://localhost:3000");
  }

  return [...new Set(configuredOrigins)];
};

module.exports = getClientOrigins;
