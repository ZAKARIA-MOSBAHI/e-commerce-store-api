const Notification = require("../models/notification");
module.exports.getNotifications = async (req, res) => {
  try {
    const { limit } = req.query;
    const parsedLimit = Number(limit);

    let notificationsQuery = Notification.find()
      .select("-__v")
      .sort({ createdAt: -1 });

    if (!Number.isNaN(parsedLimit)) {
      notificationsQuery = notificationsQuery.limit(parsedLimit);
    }
    const notifications = await notificationsQuery;

    const unreadCount = await Notification.countDocuments({
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
module.exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Notification.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
module.exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true },
    ).select("-__v");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
