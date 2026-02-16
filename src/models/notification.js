const mongoose = require("mongoose");

/*
  Scalable Notification Schema

  Supports multiple notification types:
  - ORDER_CREATED
  - ORDER_DELIVERED
  - ORDER_CANCELLED
  - ACCOUNT_SUSPENDED
  - ACCOUNT_DELETED
  - USER_REGISTERED
  - LOW_STOCK
  - SYSTEM_ALERT
*/

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "ORDER_CREATED",
        "ORDER_DELIVERED",
        "ORDER_CANCELLED",

        "ACCOUNT_SUSPENDED",
        "ACCOUNT_DELETED",

        "USER_REGISTERED",
        "USER_CREATED",

        "LOW_STOCK",

        "SYSTEM_ALERT",
      ],
      required: true,
      index: true, // improves filtering performance
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    /**
     * Who triggered the notification
     * example:
     * - user who placed order
     * - admin who suspended account
     * - system (optional null)
     */
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    /**
     * Optional related order
     */
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    /**
     * Optional related product (useful for LOW_STOCK)
     */
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    /**
     * Read status
     */
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * Optional metadata for extensibility
     * example:
     * { oldStatus: "active", newStatus: "suspended" }
     */
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Notification", notificationSchema);
