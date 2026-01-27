const handleErrors = require("../utils/errorHandler");
const mongoose = require("mongoose");
const Cart = require("../models/cart");
const Product = require("../models/product");
const Address = require("../models/address");
const Order = require("../models/order");
const Notification = require("../models/notification");
// GET ALL ORDERS
module.exports.getOrders = (req, res) => {
  try {
    res.json({
      success: true,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// GET ORDER BY ORDER ID
module.exports.getOrderById = (req, res) => {
  try {
    res.json({
      success: true,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// CREATE AN ORDER
module.exports.createClientOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.user;

    const userCart = await Cart.findOne({ userId })
      .populate("items.productId")
      .session(session);

    if (!userCart || userCart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Cart is empty or not found",
      });
    }

    const userAddress = await Address.findOne({ userId }).session(session);
    if (!userAddress) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Shipping address not found",
      });
    }

    // Stock validation + update
    for (const item of userCart.items) {
      const product = await Product.findById(item.productId._id).session(
        session,
      );

      if (!product) {
        throw new Error("One of the products no longer exists");
      }

      const available = product.sizes.get(item.itemSize) - item.quantity >= 0;

      if (!available) {
        throw new Error(
          `Insufficient stock for ${product.name} in size ${item.itemSize}`,
        );
      }

      product.sizes.set(
        item.itemSize,
        product.sizes.get(item.itemSize) - item.quantity,
      );

      await product.save({ session });
    }

    const newOrder = await Order.create(
      // using array to force mongoose to use the current session
      [
        {
          userId,
          orderNumber: `ORD-${Date.now()}`,
          items: userCart.items.map((item) => ({
            product: item.productId._id,
            quantity: item.quantity,
            price: item.price,
            size: item.itemSize,
          })),
          total: userCart.total,
          shippingAddress: userAddress._id,
        },
      ],

      { session },
    );

    // Clear cart
    userCart.items = [];
    userCart.total = 0;
    userCart.totalAfterDiscount = 0;
    userCart.appliedDiscounts = [];

    await userCart.save({ session });
    // create notification
    await Notification.create(
      [
        {
          type: "ORDER_CREATED",
          // optional : use user name in message
          message: `New order placed by user ${userId}`,
          order: newOrder[0]._id,
          sender: userId,
        },
      ],
      { session },
    );

    // next send confirmation email
    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, order: newOrder[0] });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// CANCEL AN ORDER
module.exports.cancelOrder = (req, res) => {
  try {
    res.json({
      success: true,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// UPDATE AN ORDER
module.exports.updateOrder = (req, res) => {
  try {
    res.json({
      success: true,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
//GET THE LOGGING USER'S ORDERS
module.exports.getClientOrders = (req, res) => {
  try {
    res.json({
      success: true,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
//GET THE LOGGING USER'S ORDERS BY ID
module.exports.getClientOrderById = (req, res) => {
  try {
    res.json({
      success: true,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// CANCEL THE LOGGING USER'S ORDER
module.exports.cancelClientOrder = (req, res) => {
  try {
    res.json({
      success: true,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
