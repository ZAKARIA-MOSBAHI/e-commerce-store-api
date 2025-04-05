const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true, // Added required constraint
        },
        quantity: {
          type: Number,
          min: 1,
          default: 1,
        },
        itemSize: {
          type: String,
          required: true,
        },
      },
    ],
    total: {
      type: Number,
      default: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
    },
    appliedDiscounts: [
      {
        code: String,
        discountId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Discount",
        },
        amount: Number,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Cart", cartSchema);
