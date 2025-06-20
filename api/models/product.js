const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"], // Required with custom error message
      minlength: [3, "Product name must be at least 3 characters long"], // Minimum length validation
    },
    price: {
      type: Number,
      required: [true, "Product price is required"], // Required with error message
      min: [0, "Price cannot be negative"], // Min value validation
    },
    description: {
      type: String,
      required: false, // Optional field
    },
    mainImage: {
      url: {
        type: String,
        required: [true, "Main image URL is required"],
      },
      altText: { type: String },
    },
    additionalImages: [
      {
        url: { type: String, required: true },
        altText: { type: String, required: true },
      },
    ],
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // Name of the referenced model
      required: [true, "Category ID is required"], // Category ID is required
    },
    gender: {
      type: String,
      enum: ["men", "women", "kids"],
      required: [true, "Gender is required"],
    },
    badge: {
      type: String,
    },
    stock: {
      type: Number,
    },
    sizes: {
      type: Map, //means object with string keys and values
      of: Number,
      required: [true, "Sizes with quantities are required"],
    },
  },
  { timestamps: true }
);
// Automatically calculate stock based on sizes before saving
productSchema.pre("save", function (next) {
  if (this.sizes && this.sizes instanceof Map) {
    let total = 0;
    for (const qty of this.sizes.values()) {
      total += qty;
    }
    this.stock = total;
  }
  next();
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
