const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    required: [true, "Category name is required"], // Required with custom error message
    minlength: [3, "Category name must be at least 3 characters long"], // Minimum length validation
  },
  slug: {
    type: String,
    required: [true, "Category Slug is required"],
    minlength: [3, "Category name must be at least 3 characters long"], // Minimum length validation
  },
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
