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
        price: {
          type: Number,
          required: true,
          min: 0,
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
      required: true,
      min: 0,
    },
    totalAfterDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "abandoned"],
      default: "active",
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

cartSchema.pre("save", function (next) {
  if (!this.items || this.items.length === 0) {
    this.total = 0;
  } else {
    this.total = this.items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return sum + quantity * price;
    }, 0);
  }

  next();
});

module.exports = mongoose.model("Cart", cartSchema);
