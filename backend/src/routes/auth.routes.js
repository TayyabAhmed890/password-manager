const express = require("express");

const {
  register,
  login,
  logout,
  forgotPassword,
  getCurrentUser,
} = require("../controllers/auth.controllers");
const protect = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/me", protect, getCurrentUser);

router.post("/register", register);

router.post("/login", login);

router.post("/logout", protect, logout);

router.post("/forgot-password", forgotPassword);

module.exports = router;