const mongoose = require("mongoose");
const Cart = require("../models/cart");
const handleErrors = require("../../utils/errorHandler");
const Product = require("../models/product");

module.exports.getClientCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const userCart = await Cart.findOne({ userId }).populate("items.productId");
    if (!userCart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    return res.status(200).json(userCart);
  } catch (e) {
    return handleErrors(e, res);
  }
};

module.exports.addItemsToClientCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId, itemSize } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    // checking if the size is available on the product
    const sizeAvailable = product.sizes.find((size) => (size = itemSize));
    if (!sizeAvailable)
      return res.status(404).json({ message: "Size not available" });

    // Find the user's cart if not create one
    let cart = await Cart.findOne({ userId })
      .populate("items.productId")
      .lean();

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // Check if the item sent by the user exists in the cart
    const existingItem = cart.items.find(
      (item) => item.productId._id.toString() === productId.toString()
    );

    let updatedCart;
    if (existingItem) {
      // if exists update the quantity of the item (increment by 1)
      updatedCart = await Cart.findOneAndUpdate(
        { userId, "items.productId": productId },
        { $inc: { "items.$.quantity": 1 } },
        //$(positional operator) : tells mongodb to update the first item in the array that matches the filter
        { new: true }
      )
        .populate({ path: "items.productId", select: "name price mainImage" })
        .lean();
      //.lean : converts the mongodb document to a js object
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
