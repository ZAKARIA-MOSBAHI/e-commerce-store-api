const mongoose = require("mongoose");
/*
    For now notifications are only created for new orders
    next : - scale to include events like (order delivered, cancelled , low stock , user registered)
*/
const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ORDER_CREATED"],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // the client
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
