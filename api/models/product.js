const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
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
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the creation date
  },
  stock: {
    type: Number,
    required: [true, "Stock is required"],
  },
  sizes: [
    {
      type: String,
      required: [true, "Sizes available are required"],
    },
  ],
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
