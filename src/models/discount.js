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
  minCartValue: Number,
  isActive: {
    type: Boolean,
    default: true,
  },
  maxUsesPerUser: Number,
  usedCount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Discount", discountSchema);
