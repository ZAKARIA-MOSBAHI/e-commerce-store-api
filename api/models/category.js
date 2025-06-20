const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: [true, "Category name is required"], // Required with custom error message
    minlength: [3, "Category name must be at least 3 characters long"], // Minimum length validation
  },
  slug: {
    type: String,
    required: [true, "Category Slug is required"],
    trim: true,
    unique: true,
    minlength: [3, "Category name must be at least 3 characters long"], // Minimum length validation
  },
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
