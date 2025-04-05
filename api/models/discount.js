// models/Discount.js
const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ["percentage", "fixed", "free_shipping"],
    required: true,
  },
  value: Number,
  maxDiscount: Number,
  minCartValue: Number,
  validFrom: Date,
  validUntil: Date,
  maxUses: Number,
  usedCount: {
    type: Number,
    default: 0,
  },
  // if the discount is for a specific product
  applicableProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  // if the discount is for a specific category
  applicableCategories: [String],
  //if the discount is for a specific user
  userSpecific: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  singleUse: Boolean,
});

module.exports = mongoose.model("Discount", discountSchema);
