const handleErrors = require("../utils/errorHandler");
const mongoose = require("mongoose");
const Cart = require("../models/cart");
const Product = require("../models/product");
const Address = require("../models/address");
const Order = require("../models/order");
const Notification = require("../models/notification");
const User = require("../models/user");

// GET ORDER BY ORDER ID
module.exports.getClientOrderById = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const order = await Order.findOne({ userId, _id: id })
      .select("-__v")
      .populate([
        { path: "userId", select: "name email phone _id" },
        {
          path: "shippingAddress",
          select: "_id street city zipCode country",
        },
        {
          path: "items.product",
          select: "name price mainImage",
        },
      ]);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No order found for this user",
      });
    }
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
//GET THE LOGGING USER'S ORDERS
module.exports.getClientOrders = async (req, res) => {
  try {
    const { userId } = req.user;
    const orders = await Order.find({ userId })
      .select("-__v")
      .populate([
        { path: "userId", select: "name email phone _id" },
        {
          path: "shippingAddress",
          select: "_id street city zipCode country",
        },
        {
          path: "items.product",
          select: "name price mainImage",
        },
      ])
      .sort({ createdAt: -1 });
    if (!orders) {
      return res.status(404).json({
        success: false,
        message: "No orders found for this user",
      });
    }
    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
// CREATE AN ORDER (requires email sending )
module.exports.createClientOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // should get the cart from the req body? or from the userId?
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
    const userInfos = await User.findOne({ _id: userId }).session(session);
    if (!userInfos.phone) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Phone number not found",
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

    const [newOrder] = await Order.create(
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

    await newOrder.populate([
      { path: "userId", select: "name email phone" },
      {
        path: "shippingAddress",
        select: "street city zipCode country",
      },
      {
        path: "items.product",
        select: "name price mainImage",
      },
    ]);

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
          order: newOrder._id,
          sender: userId,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    // next send confirmation email after committing
    session.endSession();

    res.json({ success: true, order: newOrder });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
// CANCEL AN ORDER BY THE LOGGED IN USER
module.exports.cancelClientOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.orderStatus === "SHIPPED" || order.orderStatus === "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Shipped or delivered orders cannot be cancelled",
      });
    }

    order.orderStatus = "CANCELLED";
    order.cancelledAt = new Date();
    order.cancelledBy = "USER";

    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// GET ALL ORDERS
module.exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .select("-__v")
      .populate([
        { path: "userId", select: "name email phone _id" },
        {
          path: "shippingAddress",
          select: "_id street city zipCode country",
        },
        {
          path: "items.product",
          select: "name price mainImage",
        },
      ])
      .sort({ createdAt: -1 });
    if (!orders) {
      return res.status(404).json({
        success: false,
        message: "No order found",
      });
    }
    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
// GET ORDER BY  ID (ADMIN)
module.exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ _id: id })
      .select("-__v")
      .populate([
        { path: "userId", select: "name email phone _id" },
        {
          path: "shippingAddress",
          select: "_id street city zipCode country",
        },
        {
          path: "items.product",
          select: "name price mainImage",
        },
      ])
      .sort({ createdAt: -1 });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No order found with this ID",
      });
    }
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
/*
-> these update functions should be optimized 
*/

// CONFIRM AN ORDER (ADMIN )
module.exports.confirmOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.orderStatus !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be confirmed",
      });
    }

    order.orderStatus = "CONFIRMED";
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
// SHIP AN ORDER (ADMIN)
module.exports.shipOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.orderStatus !== "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed orders can be shipped",
      });
    }

    order.orderStatus = "SHIPPED";
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
// DELIVER AN ORDER (ADMIN)
module.exports.deliverOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.orderStatus !== "SHIPPED") {
      return res.status(400).json({
        success: false,
        message: "Only shipped orders can be delivered",
      });
    }

    order.orderStatus = "DELIVERED";
    order.deliveredAt = new Date();
    order.paymentStatus = "PAID";

    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// CANCEL AN ORDER (ADMIN)
module.exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.orderStatus === "SHIPPED" || order.orderStatus === "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Shipped or delivered orders cannot be cancelled",
      });
    }

    order.orderStatus = "CANCELLED";
    order.cancelledAt = new Date();
    order.cancelledBy = "ADMIN";
    order.paymentStatus = "REFUNDED";

    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
