const mongoose = require("mongoose");
const Cart = require("../models/cart");
const handleErrors = require("../../utils/errorHandler");
const Product = require("../models/product");

module.exports.getClientCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const userCart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        select: "name price mainImage",
      })
      .lean();
    if (!userCart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    const transformedCart = {
      ...userCart,
      total: userCart.items.reduce(
        (sum, item) => sum + item.quantity * item.productId.price,
        0
      ),
    };

    return res.status(200).json({
      success: true,
      cart: transformedCart,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// this method increments the first element to match the id , excluding the item size why ?
module.exports.addItemsToClientCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId, itemSize } = req.body;
    const productIdObj = new mongoose.Types.ObjectId(productId);
    console.log("product id is : ", productId);
    console.log("item Size is : ", itemSize);

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    // checking if the size is available on the product
    const sizeAvailable = product.sizes.find((size) => size === itemSize);

    if (!sizeAvailable)
      return res.status(400).json({
        success: false,
        message: "Size not available",
        availableSizes: product.sizes,
      });

    // Find the user's cart if not create one
    let cart = await Cart.findOne({ userId })
      .populate("items.productId")
      .lean();
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // Check if the item sent by the user exists in the cart
    const existingItem = cart.items.find(
      (item) =>
        item.productId._id.toString() === productId.toString() &&
        item.itemSize === itemSize
    );
    console.log(existingItem);
    let updatedCart;
    if (existingItem) {
      updatedCart = await Cart.findOneAndUpdate(
        {
          userId,
          items: {
            $elemMatch: {
              productId: productIdObj,
              itemSize: itemSize,
            },
          },
        },
        { $inc: { "items.$.quantity": 1 } },
        { new: true, runValidators: true, upsert: true }
      )
        .populate({ path: "items.productId", select: "name price mainImage" })
        .lean();
    } else {
      // Add new item
      updatedCart = await Cart.findOneAndUpdate(
        { userId },
        { $push: { items: { productId, quantity: 1, itemSize } } },
        { new: true, runValidators: true }
      )
        .populate({ path: "items.productId", select: "name price mainImage" })
        .lean();
    }

    // Transform response
    const transformedCart = {
      ...updatedCart,
      items: updatedCart.items.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        itemSize: item.itemSize,
      })),
      // calculating the total
      total: updatedCart.items.reduce(
        (sum, item) => sum + item.quantity * item.productId.price,
        0
      ),
    };

    return res.status(200).json({
      success: true,
      cart: transformedCart,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};

module.exports.deleteItemFromClientCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId, itemSize } = req.body;

    // Convert productId to ObjectId
    const productIdObj = new mongoose.Types.ObjectId(productId);

    // Find user's cart
    const userCart = await Cart.findOne({ userId });
    if (!userCart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    // Find product in cart
    const productToDelete = userCart.items.find(
      (item) =>
        item.productId.toString() === productId && item.itemSize === itemSize
    );
    console.log(productToDelete);
    if (!productToDelete) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in cart" });
    }

    let updatedCart;
    if (productToDelete.quantity > 1) {
      // Decrement quantity
      updatedCart = await Cart.findOneAndUpdate(
        { userId, "items.productId": productIdObj },
        { $inc: { "items.$.quantity": -1 } },
        { new: true }
      )
        .populate({ path: "items.productId", select: "name price mainImage" })
        .lean();
    } else {
      // Remove item completely
      updatedCart = await Cart.findOneAndUpdate(
        { userId },
        { $pull: { items: { productId: productIdObj, itemSize: itemSize } } },
        { new: true, runValidators: true }
      )
        .populate({ path: "items.productId", select: "name price mainImage" })
        .lean();
    }

    // Transform response
    const transformedCart = {
      ...updatedCart,
      items: updatedCart.items.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        itemSize: item.itemSize,
      })),
      total: updatedCart.items.reduce(
        (sum, item) => sum + item.quantity * item.productId.price,
        0
      ),
    };

    return res.status(200).json({
      success: true,
      cart: transformedCart,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
module.exports.clearClientCart = async (req, res) => {
  try {
    const { userId } = req.user;

    // Clear cart and return updated document
    const clearedCart = await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [] } }, // Clear all items
      {
        new: true, // Return updated document
        runValidators: true, // Ensure updated document validates
        lean: true, // Return plain JavaScript object
      }
    );

    if (!clearedCart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Create consistent response format
    const transformedCart = {
      _id: clearedCart._id,
      userId: clearedCart.userId,
      items: [],
      total: 0,
      createdAt: clearedCart.createdAt,
      updatedAt: clearedCart.updatedAt,
    };

    return res.status(200).json({
      success: true,
      cart: transformedCart,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
