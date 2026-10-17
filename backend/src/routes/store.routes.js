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

const router = express.Router();


// GET /api/store
router.get(
  "/",
  protect,
  requireUser,
  getPasswords
);


// POST /api/store/create
router.post(
  "/create",
  protect,
  requireUser,
  createPassword
);


// GET /api/store/:id/password
router.get(
  "/:id/password",
  protect,
  requireUser,
  revealPassword
);

// PATCH /api/store/:id
router.patch("/:id", protect, requireUser, updatePassword);

// DELETE /api/store/:id
router.delete("/:id", 
  protect,
  requireUser,
  deletePassword
);


module.exports = router;