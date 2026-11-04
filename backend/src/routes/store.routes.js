const express = require("express");

const {
  createPassword,
  getPasswords,
  revealPassword,
  deletePassword,
  updatePassword,
} = require("../controllers/store.controllers");

const protect = require(
  "../middlewares/auth.middleware"
);
const requireUser = require("../middlewares/user.middleware");
const { createRateLimit } = require("../middlewares/rateLimit.middleware");
const csrfProtection = require("../middlewares/csrf.middleware");

const router = express.Router();
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

const revealRateLimit = createRateLimit({
  name: "vault-reveal",
  limit: 30,
  window: "1 m",
  identifier: (req) => req.user.id,
});
const createRateLimitByUser = createRateLimit({
  name: "vault-create",
  limit: 10,
  window: "1 m",
  identifier: (req) => req.user.id,
});
const updateRateLimitByUser = createRateLimit({
  name: "vault-update",
  limit: 20,
  window: "1 m",
  identifier: (req) => req.user.id,
});


// GET /api/store
router.get(
  "/",
  protect,
  requireUser,
  csrfProtection,
  getPasswords
);


// POST /api/store/create
router.post(
  "/create",
  protect,
  requireUser,
  csrfProtection,
  createRateLimitByUser,
  createPassword
);


// GET /api/store/:id/password
router.get(
  "/:id/password",
  protect,
  requireUser,
  csrfProtection,
  revealRateLimit,
  revealPassword
);

// PATCH /api/store/:id
router.patch(
  "/:id",
  protect,
  requireUser,
  csrfProtection,
  updateRateLimitByUser,
  updatePassword
);

// DELETE /api/store/:id
router.delete("/:id", 
  protect,
  requireUser,
  csrfProtection,
  deletePassword
);


module.exports = router;