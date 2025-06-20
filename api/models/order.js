const mongoose = require("mongoose");
const orderSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
          required: true,
        },
        size: {
          type: String,
          required: true,
        }, // Optional field
      },
    ],
    total: { type: Number, required: true, min: 0 },
    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["CashOnDelivery", "CreditCard", "PayPal"],
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, retDoc) => {
        delete retDoc.__v;
        return retDoc;
      },
    },
  }
);
module.exports = mongoose.model("Order", orderSchema);
