const express = require("express");

const {
  register,
  login,
  logout,
  forgotPassword,
  forgotAdminPassword,
  getCurrentUser,
  rotateRecoveryCode,
  changePassword,
  deleteOwnAccount,
  deleteAdminProfile,
} = require("../controllers/auth.controllers");
const protect = require("../middlewares/auth.middleware");
const requireUser = require("../middlewares/user.middleware");
const requireAdmin = require("../middlewares/admin.middleware");
const {
  createRateLimit,
  normalizeEmailIdentifier,
} = require("../middlewares/rateLimit.middleware");
const csrfProtection = require("../middlewares/csrf.middleware");
const adminLoginRateLimit = require("../middlewares/adminLoginRateLimit.middleware");

const router = express.Router();

const registerRateLimit = createRateLimit({
  name: "register",
  limit: 5,
  window: "15 m",
});
const loginRateLimit = createRateLimit({
  name: "login",
  limit: 10,
  window: "15 m",
});
const loginAccountRateLimit = createRateLimit({
  name: "login-account",
  limit: 5,
  window: "15 m",
  identifier: (req) =>
    `${req.ip || req.socket.remoteAddress || "unknown"}:${normalizeEmailIdentifier(req)}`,
});
const recoveryRateLimit = createRateLimit({
  name: "recovery",
  limit: 5,
  window: "5 m",
});
const recoveryAccountRateLimit = createRateLimit({
  name: "recovery-account",
  limit: 3,
  window: "5 m",
  identifier: (req) =>
    `${req.ip || req.socket.remoteAddress || "unknown"}:${normalizeEmailIdentifier(req)}`,
});
const accountSecurityRateLimit = createRateLimit({
  name: "account-security",
  limit: 5,
  window: "5 m",
  identifier: (req) => req.user.id,
});

router.get("/me", protect, getCurrentUser);

router.post("/register", csrfProtection, registerRateLimit, register);

router.post(
  "/login",
  csrfProtection,
  adminLoginRateLimit,
  loginRateLimit,
  loginAccountRateLimit,
  login
);

router.post("/logout", protect, csrfProtection, logout);
router.post(
  "/recovery-code",
  protect,
  requireUser,
  csrfProtection,
  accountSecurityRateLimit,
  rotateRecoveryCode
);
router.post(
  "/change-password",
  protect,
  requireUser,
  csrfProtection,
  accountSecurityRateLimit,
  changePassword
);
router.post(
  "/admin/change-password",
  protect,
  requireAdmin,
  csrfProtection,
  accountSecurityRateLimit,
  changePassword
);
router.delete(
  "/admin/profile",
  protect,
  requireAdmin,
  csrfProtection,
  accountSecurityRateLimit,
  deleteAdminProfile
);
router.delete(
  "/account",
  protect,
  requireUser,
  csrfProtection,
  accountSecurityRateLimit,
  deleteOwnAccount
);

router.post(
  "/forgot-password",
  csrfProtection,
  recoveryRateLimit,
  recoveryAccountRateLimit,
  (req, res) => forgotPassword(req, res)
);
router.post(
  "/admin/forgot-password",
  csrfProtection,
  recoveryRateLimit,
  recoveryAccountRateLimit,
  forgotAdminPassword
);

module.exports = router;