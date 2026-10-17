
const express = require("express");

const protect = require("../middlewares/auth.middleware");
const requireAdmin = require("../middlewares/admin.middleware");

const {
  getAllUsers,
  deleteUser,
} = require("../controllers/admin.controllers");

const router = express.Router();

// Both routes require authentication and admin permission.
router.get("/users", protect, requireAdmin, getAllUsers);

router.delete("/users/:id", protect, requireAdmin, deleteUser);

module.exports = router;
