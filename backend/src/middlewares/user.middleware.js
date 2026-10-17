const requireUser = (req, res, next) => {
  if (req.user?.role !== "user") {
    return res.status(403).json({
      success: false,
      message: "Normal user access required.",
    });
  }

  return next();
};

module.exports = requireUser;