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
        type: {
          type: String,
          enum: ["percentage", "fixed"],
          required: true,
        },
        value: {
          type: Number,
          required: true,
          min: 0,
        },
        discountId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Discount",
        },
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

cartSchema.pre("save", async function (next) {
  // 1. Calculate base total
  this.total = this.items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return sum + quantity * price;
  }, 0);

  // 2. No discount applied
  if (!this.appliedDiscounts || this.appliedDiscounts.length === 0) {
    this.totalAfterDiscount = 0;
    return next();
  }

  // 3. Calculate discount
  const appliedDiscount = this.appliedDiscounts[0];
  let discountAmount = 0;

  switch (appliedDiscount.type) {
    case "percentage":
      discountAmount = this.total * (appliedDiscount.value / 100);
      break;
    case "fixed":
      discountAmount = appliedDiscount.value;
      break;
    case "free_shipping":
      discountAmount = 0; // handle shipping cost separately if needed
      break;
    default:
      discountAmount = 0;
  }

  // 4. Final discounted total, ensuring non-negative
  this.totalAfterDiscount = Math.max(this.total - discountAmount, 0);

  next();
});

module.exports = mongoose.model("Cart", cartSchema);
