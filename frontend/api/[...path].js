import { Buffer } from 'node:buffer'
import process from 'node:process'

const forwardedRequestHeaders = [
  "accept",
  "authorization",
  "content-type",
  "cookie",
  "origin",
  "referer",
  "sec-fetch-site",
];

const forwardedResponseHeaders = [
  "cache-control",
  "ratelimit-limit",
  "ratelimit-remaining",
  "ratelimit-reset",
  "retry-after",
];

const getBackendOrigin = () => {
  const configuredUrl = process.env.BACKEND_URL;
  if (!configuredUrl) {
    throw new Error("BACKEND_URL is not configured.");
  }

  const backendUrl = new URL(configuredUrl);
  if (
    backendUrl.protocol !== "https:" ||
    backendUrl.pathname !== "/" ||
    backendUrl.search ||
    backendUrl.hash
  ) {
    throw new Error("BACKEND_URL must be an HTTPS origin without a path.");
  }

  return backendUrl.origin;
};

const getRequestBody = (req) => {
  if (req.body === undefined || req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  if (
    typeof req.body === "string" ||
    Buffer.isBuffer(req.body) ||
    req.body instanceof Uint8Array
  ) {
    return req.body;
  }

  return JSON.stringify(req.body);
};

export default async (req, res) => {
  let backendOrigin;
  try {
    backendOrigin = getBackendOrigin();
  } catch (error) {
    console.error("API proxy configuration error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Service configuration error.",
    });
  }

  const incomingUrl = new URL(req.url, "https://frontend-proxy.invalid");
  let requestPath = incomingUrl.pathname;
  if (!requestPath.startsWith("/api/") && req.query?.path) {
    const pathSegments = Array.isArray(req.query.path)
      ? req.query.path
      : [req.query.path];
    requestPath = `/api/${pathSegments.map(encodeURIComponent).join("/")}`;
  }

  if (!requestPath.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "Route not found.",
    });
  }

  const headers = new Headers();
  for (const headerName of forwardedRequestHeaders) {
    const headerValue = req.headers[headerName];
    if (headerValue) headers.set(headerName, headerValue);
  }

  try {
    const backendResponse = await fetch(
      `${backendOrigin}${requestPath}${incomingUrl.search}`,
      {
        method: req.method,
        headers,
        body: getRequestBody(req),
        redirect: "manual",
      }
    );

    res.statusCode = backendResponse.status;
    res.setHeader("Cache-Control", "no-store");

    for (const headerName of forwardedResponseHeaders) {
      const headerValue = backendResponse.headers.get(headerName);
      if (headerValue) res.setHeader(headerName, headerValue);
    }

    const cookies = backendResponse.headers.getSetCookie?.();
    if (cookies?.length) {
      res.setHeader("Set-Cookie", cookies);
    } else {
      const cookie = backendResponse.headers.get("set-cookie");
      if (cookie) res.setHeader("Set-Cookie", cookie);
    }

    const contentType = backendResponse.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    return res.send(Buffer.from(await backendResponse.arrayBuffer()));
  } catch (error) {
    console.error("Backend proxy request failed:", error.name || "Error");
    return res.status(503).json({
      success: false,
      message: "Service temporarily unavailable.",
    });
  }
};
