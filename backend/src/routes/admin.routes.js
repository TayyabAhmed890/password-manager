
const express = require("express");

const protect = require("../middlewares/auth.middleware");
const requireAdmin = require("../middlewares/admin.middleware");
const csrfProtection = require("../middlewares/csrf.middleware");

const {
  getAllUsers,
  deleteUser,
} = require("../controllers/admin.controllers");

const router = express.Router();

// These routes require authentication and admin permission.
router.get("/users", protect, requireAdmin, csrfProtection, getAllUsers);

router.delete(
  "/users/:id",
  protect,
  requireAdmin,
  csrfProtection,
  deleteUser
);

module.exports = router;
