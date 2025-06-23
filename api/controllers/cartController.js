/*TIP : USE MongoDB sessions to run multiple related operations 
(updating the cart, user, and discount) within a single transaction helps ensure consistency. 
If any update fails, the whole transaction is rolled back.*/
const mongoose = require("mongoose");
const Cart = require("../models/cart");
const handleErrors = require("../../utils/errorHandler");
const Product = require("../models/product");
const Discount = require("../models/discount");
const User = require("../models/user");
const Order = require("../models/order");
const { verifyStockQuantity } = require("../../utils/verifyStockQuantity");
const { abortWithError } = require("../../utils/utils");
const { updateCartTotalAfterDiscount } = require("../../utils/cartUtils");
// GET THE CLIENT'S CART
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

    return res.status(200).json({
      success: true,
      cart: userCart,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// ADD ITEM TO THE CLIENT'S CART
module.exports.addItemsToClientCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId, itemSize } = req.body;
    const productIdObj = new mongoose.Types.ObjectId(productId);
    // Step 1: Validate product
    const product = await Product.findById(productIdObj);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Step 2: Validate size exists in Map (case-sensitive match)
    if (!product.sizes.has(itemSize)) {
      return res.status(400).json({
        success: false,
        message: "Size not available",
        availableSizes: Array.from(product.sizes.keys()),
      });
    }

    // Step 3: Fetch or create user's cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
        total: 0,
        discountTotal: 0,
        appliedDiscounts: [],
        status: "active",
      });
    }
    // Step 4: Check if item with same size already exists

    if (verifyStockQuantity(product, itemSize)) {
      const existingItem = cart.items.find(
        (item) =>
          item.productId.toString() === productIdObj.toString() &&
          item.itemSize === itemSize
      );
      if (existingItem) {
        // checking if there available stock for the item
        existingItem.quantity += 1;
      } else {
        cart.items.push({
          productId: productIdObj,
          itemSize,
          quantity: 1,
          price: product.price,
        });
      }
      // updating the cart discount total if a discount is applied
    } else {
      // If no stock available for this size, abort transaction
      return res.status(400).json({
        success: false,
        message: `Not enough stock available for size ${itemSize}. Only ${
          product.sizes.get(itemSize) || 0
        } left`,
      });
    }

    await cart.save();
    return res.status(200).json({
      success: true,
      cart: cart.toObject(),
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// REMOVE ITEM FROM THE CLIENT'S CART
module.exports.deleteItemFromClientCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId, itemSize } = req.body;

    const productIdObj = new mongoose.Types.ObjectId(productId);

    // Step 1: Find product
    const product = await Product.findById(productIdObj);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Step 2: Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Cart is empty or not found" });
    }

    // Step 3: Find the item to delete
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productIdObj.toString() &&
        item.itemSize === itemSize
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    // Step 5: Remove item from cart
    cart.items.splice(itemIndex, 1);

    await cart.save();

    return res.status(200).json({
      success: true,
      cart: cart.toObject(),
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// increment or decrement the quantity of an item in the cart
module.exports.updateItemQuantity = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.user;
    const { productId, itemSize, operation } = req.body;

    if (!["increment", "decrement"].includes(operation)) {
      return abortWithError(res, session, 400, "Invalid operation");
    }

    const productIdObj = new mongoose.Types.ObjectId(productId);

    // Validate product exists
    const product = await Product.findById(productIdObj).session(session);
    if (!product) {
      return abortWithError(res, session, 404, "Product not found");
    }

    // Validate size exists
    if (!product.sizes.has(itemSize)) {
      return abortWithError(res, session, 400, "Size not available", {
        availableSizes: Array.from(product.sizes.keys()),
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart) {
      return abortWithError(res, session, 404, "Cart not found");
    }

    const cartItem = cart.items.find(
      (item) =>
        item.productId.toString() === productIdObj.toString() &&
        item.itemSize === itemSize
    );

    if (!cartItem) {
      return abortWithError(res, session, 404, "Item not found in cart");
    }

    // Perform update based on operation
    if (operation === "increment") {
      const availableStock = product.sizes.get(itemSize);
      if (availableStock < 1) {
        return abortWithError(
          res,
          session,
          400,
          `Not enough stock available. Only ${availableStock} left`
        );
      }
      cartItem.quantity += 1;
      product.sizes.set(itemSize, availableStock - 1);
    } else if (operation === "decrement") {
      if (cartItem.quantity < 1) {
        return abortWithError(
          res,
          session,
          400,
          `Cannot decrement, item quantity is already zero`
        );
      }
      cartItem.quantity -= 1;
      product.sizes.set(itemSize, product.sizes.get(itemSize) + 1);

      // Optional: remove item if quantity hits 0
      if (cartItem.quantity === 0) {
        cart.items = cart.items.filter(
          (item) =>
            !(
              item.productId.toString() === productIdObj.toString() &&
              item.itemSize === itemSize
            )
        );
      }
    }

    await product.save({ session });
    await cart.save({ session });
    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      cart: cart.toObject(),
    });
  } catch (e) {
    await session.abortTransaction();
    return handleErrors(e, res);
  } finally {
    session.endSession();
  }
};
// CLEAR CLIENT'S CART
module.exports.clearClientCart = async (req, res) => {
  try {
    const { userId } = req.user;

    const clearedCart = await Cart.findOneAndUpdate(
      { userId },
      {
        $set: {
          items: [],
          total: 0,
          discountTotal: 0,
          appliedDiscounts: [],
          totalAfterDiscount: 0,
          status: "active",
        },
      },
      { new: true }
    );

    if (!clearedCart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      cart: clearedCart.toObject(),
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};

// APPLY DISCOUNT TO THE CLIENT'S CART
module.exports.applyDiscount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { discountCode } = req.body;

    if (!discountCode) {
      return res.status(400).json({
        success: false,
        message: "discountCode is required",
      });
    }

    const discount = await Discount.findOne({
      code: discountCode,
      isActive: true,
    });
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Discount code not found or inactive",
      });
    }

    const userCart = await Cart.findOne({ userId });
    if (!userCart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found for this user",
      });
    }
    if (userCart.appliedDiscounts.length > 0) {
      return res.status(400).json({
        success: false,
        message: "A Discount already applied to this cart",
      });
    }

    if (discount.minCartValue && userCart.total < discount.minCartValue) {
      return res.status(400).json({
        success: false,
        message: `Cart total must be at least ${discount.minCartValue} to apply this discount`,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userUsageCount = user.usedDiscounts
      ? user.usedDiscounts.filter((d) => {
          return d.discountId.toString() === discount._id.toString();
        }).length
      : 0;

    if (discount.maxUsesPerUser && userUsageCount >= discount.maxUsesPerUser) {
      return res.status(400).json({
        success: false,
        message: `You have already used this discount code ${discount.maxUsesPerUser} times`,
      });
    }

    // Add discount info to appliedDiscounts
    const discountInfo = {
      type: discount.type,
      value: discount.value,
      discountId: discount._id.toString(),
    };
    userCart.appliedDiscounts.push(discountInfo);

    await userCart.save();
    // THIS WILL BE ADDED WHEN THE USER CHECKOUT THE CART
    // user.usedDiscounts.push({
    //   discountId: discount._id,
    //   usedAt: new Date(),
    // });
    // THIS ALSO WILL BE ADDED WHEN THE USER CHECKOUT THE CART
    // await Discount.findByIdAndUpdate(
    //   discount._id,
    //   { $inc: { usedCount: 1 } },
    //   { session }
    // );

    res.json({
      success: true,
      cart: userCart.toObject(),
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};

// REMOVE DISCOUNT FROM CART
module.exports.removeDiscount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { discountCode } = req.body;
    const discount = await Discount.findOne({ code: discountCode });
    const user = await User.findById(userId);
    if (!discount) {
      return res.status(404).json({ message: "Discount not found" });
    }
    const updatedCart = await Cart.findOneAndUpdate(
      { userId },
      [{ $set: { appliedDiscounts: [] } }, { $set: { discountTotal: 0 } }],
      { new: true, runValidators: true }
    );
    await User.findByIdAndUpdate(userId, { $set: { usedDiscounts: [] } });
    await Discount.findByIdAndUpdate(discount._id, {
      $inc: { usedCount: -1 },
    });
    res.json(updatedCart);
  } catch (e) {
    return handleErrors(e, res);
  }
};
// CONVERT THE CART TO AN ORDER
module.exports.checkout = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const { userId } = req.user;

    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.address) {
      return res.status(400).json({ message: "Shipping address required" });
    }

    const cart = await Cart.findOne({ userId }).populate(
      "items.productId",
      "price"
    );
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Invalid or empty cart" });
    }

    // Correction clé : Conversion explicite en ObjectId et validation
    const orderItems = cart.items.map((item) => {
      if (!item.productId || !item.productId._id) {
        throw new Error("Invalid product reference in cart");
      }

      return {
        product: new mongoose.Types.ObjectId(item.productId._id), // Conversion explicite
        quantity: item.quantity,
        price: item.productId.price,
        size: item.itemSize,
      };
    });

    const order = new Order({
      _id: new mongoose.Types.ObjectId(),
      userId,
      items: orderItems,
      total: cart.discountTotal ?? cart.total,
      shippingAddress: user.address,
      paymentMethod,
      status: "pending",
    });

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("items.product", "name price")
      .populate("shippingAddress", "street city state country");
    if (populatedOrder) {
      await Cart.updateOne(
        { userId },
        {
          $set: {
            items: [],
            total: 0,
            discountTotal: 0,
            appliedDiscounts: [],
          },
        }
      );
    }
    res.status(201).json({
      success: true,
      order: populatedOrder,
      message: "Order created successfully",
    });
  } catch (e) {
    console.error("Checkout Error:", e);
    return res.status(500).json({
      error: e.message,
      stack: process.env.NODE_ENV === "development" ? e.stack : undefined,
    });
  }
};
