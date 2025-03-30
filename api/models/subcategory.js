const mongoose = require("mongoose");

const SubcategorySchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    required: [true, "Subcategory name is required"], // Required with custom error message
    minlength: [3, "Subcategory name must be at least 3 characters long"], // Minimum length validation
  },
  slug: {
    type: String,
    required: [true, "Subcategory Slug is required"],
    minlength: [3, "Subcategory name must be at least 3 characters long"], // Minimum length validation
  },
});

const Subcategory = mongoose.model("Subcategory", SubcategorySchema);
module.exports = Subcategory;
