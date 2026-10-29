const getClientOrigins = (env = process.env) => {
  const configuredOrigins = (env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (env.NODE_ENV !== "production") {
    configuredOrigins.push("http://localhost:5173", "http://localhost:3000");
  }

  return [...new Set(configuredOrigins.map((value) => {
    const url = new URL(value);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error("CLIENT_URL entries must be HTTP(S) origins without paths.");
    }

    return url.origin;
  }))];
};

module.exports = getClientOrigins;
