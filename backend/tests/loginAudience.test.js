const assert = require("assert");
const {
  getLoginAudience,
  hasOverlappingLoginOrigins,
} = require("../src/utils/loginAudience");

const request = (headers) => ({
  get(name) {
    return headers[name.toLowerCase()];
  },
});

assert.strictEqual(
  getLoginAudience(request({ origin: "https://app.example.com" }), {
    CLIENT_URL: "https://app.example.com",
    ADMIN_URL: "https://admin.example.com",
    NODE_ENV: "production",
  }),
  "user"
);
assert.strictEqual(
  getLoginAudience(request({ origin: "https://admin.example.com" }), {
    CLIENT_URL: "https://app.example.com",
    ADMIN_URL: "https://admin.example.com",
    NODE_ENV: "production",
  }),
  "admin"
);
assert.strictEqual(
  getLoginAudience(request({ referer: "https://admin.example.com/login" }), {
    CLIENT_URL: "https://app.example.com",
    ADMIN_URL: "https://admin.example.com",
    NODE_ENV: "production",
  }),
  "admin"
);
assert.strictEqual(
  getLoginAudience(request({ origin: "https://unknown.example.com" }), {
    CLIENT_URL: "https://app.example.com",
    ADMIN_URL: "https://admin.example.com",
    NODE_ENV: "production",
  }),
  null
);
assert.strictEqual(
  getLoginAudience(request({}), {
    CLIENT_URL: "https://app.example.com",
    ADMIN_URL: "https://admin.example.com",
    NODE_ENV: "production",
  }),
  null
);
assert.strictEqual(
  hasOverlappingLoginOrigins({
    CLIENT_URL: "https://app.example.com",
    ADMIN_URL: "https://app.example.com/",
  }),
  true
);

console.log("Login audience tests passed: client/admin origins and missing origins are distinguished.");
