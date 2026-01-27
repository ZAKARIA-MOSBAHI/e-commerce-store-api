const router = require("express").Router();
const notificationController = require("../controllers/notification.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth");
router.get(
  "/",
  authenticate,
  authorizeAdmin,
  notificationController.getNotifications,
);
router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  notificationController.deleteNotification,
);
router.put(
  "/:id/read",
  authenticate,
  authorizeAdmin,
  notificationController.markAsRead,
);

module.exports = router;
