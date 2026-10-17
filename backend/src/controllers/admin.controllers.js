
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Password = require("../models/store.model");

// GET /api/admin/users
// Return a paginated list of users with each user's vault count.
const getAllUsers = async (req, res) => {
  try {
    // Parse pagination parameters with safe defaults.
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Page must be positive and limit must be between 1 and 100.",
      });
    }

    const skip = (page - 1) * limit;

    // Only return fields needed by the admin dashboard.
    // Never return passwordHash or recoveryCodeHash.
    const [users, totalUsers] = await Promise.all([
      User.find({ role: "user" })
        .select("email createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments({ role: "user" }),
    ]);

    // Count vault entries for the users on this page only.
    const userIds = users.map((user) => user._id);

    const passwordCounts = userIds.length
      ? await Password.aggregate([
          {
            $match: {
              userId: { $in: userIds },
            },
          },
          {
            $group: {
              _id: "$userId",
              count: { $sum: 1 },
            },
          },
        ])
      : [];

    // Convert counts into a lookup map for easy access.
    const countMap = new Map(
      passwordCounts.map((item) => [
        item._id.toString(),
        item.count,
      ])
    );

    const data = users.map((user) => ({
      id: user._id.toString(),
      email: user.email,
      createdAt: user.createdAt,
      passwordCount: countMap.get(user._id.toString()) ?? 0,
    }));

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch users right now.",
    });
  }
};


// DELETE /api/admin/users/:id
// Delete a normal user's account and all their vault records.
const deleteUser = async (req, res) => {
  const { id } = req.params;

  // Reject malformed MongoDB ObjectIds before querying.
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID.",
    });
  }

  // Prevent an admin from accidentally deleting their own account.
  if (id === req.user.id) {
    return res.status(400).json({
      success: false,
      message: "You cannot delete your own account here.",
    });
  }

  // Use a transaction if supported (e.g. MongoDB Atlas replica set).
  // Fall back to sequential deletion if running on a standalone local MongoDB.
  try {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Only allow deletion of normal user accounts.
        const user = await User.findOne({
          _id: id,
          role: "user",
        }).session(session);

        if (!user) {
          const error = new Error("USER_NOT_FOUND");
          throw error;
        }

        // Delete all saved passwords belonging to this user.
        await Password.deleteMany({
          userId: user._id,
        }).session(session);

        // Then delete the user account itself.
        await User.deleteOne({
          _id: user._id,
        }).session(session);
      });

      return res.status(200).json({
        success: true,
        message: "User and their saved password records were deleted.",
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "User not found or cannot be deleted.",
      });
    }

    // Fallback for standalone MongoDB deployments where transactions are not supported
    if (
      error.message?.includes("Transaction numbers are only allowed") ||
      error.message?.includes("replica set")
    ) {
      const user = await User.findOne({ _id: id, role: "user" });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found or cannot be deleted.",
        });
      }

      await Password.deleteMany({ userId: user._id });
      await User.deleteOne({ _id: user._id });

      return res.status(200).json({
        success: true,
        message: "User and their saved password records were deleted.",
      });
    }

    console.error("Delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete the user right now.",
    });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
};
