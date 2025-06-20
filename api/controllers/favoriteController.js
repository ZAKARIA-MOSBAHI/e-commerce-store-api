const Favorite = require("../models/favorite");
const User = require("../models/user");
const Product = require("../models/product");
const handleErrors = require("../../utils/errorHandler");

module.exports.addFavorite = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId } = req.params;

    // Validate userId and productId
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Product ID are required",
      });
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const existingFavorite = await Favorite.findOne({
      userId,
      productId,
    });
    if (existingFavorite) {
      return res
        .status(400)
        .json({ success: false, message: "Product is already a favorite" });
    }

    // Create a new favorite entry
    const favorite = new Favorite({
      userId,
      productId,
    });

    // Save the favorite entry to the database
    await favorite.save();

    res.status(201).json({
      success: true,
      message: "Favorite added successfully",
    });
  } catch (error) {
    return handleErrors(error, res);
  }
};

module.exports.getFavorites = async (req, res) => {
  try {
    const { userId } = req.user;

    // Validate userId
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    // Fetch favorites for the user
    const favorites = await Favorite.find({ userId }).populate("productId");

    res.status(200).json({ success: true, favorites });
  } catch (error) {
    return handleErrors(error, res);
  }
};

module.exports.removeFavorite = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId } = req.params;

    // Validate userId and productId
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Product ID are required",
      });
    }

    // Remove the favorite entry
    const result = await Favorite.findOneAndDelete({
      userId,
      productId,
    });

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Favorite not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Favorite removed successfully" });
  } catch (error) {
    return handleErrors(error, res);
  }
};
