const mongoose = require("mongoose");
/**
 * Add an emailStatus field in Order model:

emailStatus: {
  type: String,
  enum: ["pending", "sent", "failed"],
  default: "pending"
}


Workflow:

Create order with emailStatus: "pending"

Try sending email

If success → update to "sent"

If error → update to "failed"

Now you can:

Retry failed emails

Monitor system health

Create admin dashboard
 */
const orderSchema = new mongoose.Schema(
  {
    // User (optional for guest checkout)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    // Order reference (for emails & admin) // should be unique
    orderNumber: {
      type: String,
      // required: true,
      // unique: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        price: {
          type: Number,
          required: true, // price at order time
        },

        size: {
          type: String,
          required: true,
        },
      },
    ],

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },

    // Order lifecycle
    orderStatus: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },

    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "REFUNDED"],
      default: "UNPAID",
    },

    paymentMethod: {
      type: String,
      required: true,
      default: "CashOnDelivery",
    },
    cancelledAt: {
      type: Date,
      required: false,
    },
    cancelledBy: {
      type: String,
      required: false,
      enum: ["USER", "ADMIN"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model("Order", orderSchema);
