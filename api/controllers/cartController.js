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

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const productSizes = product.sizes;

    if (!productSizes.has(itemSize)) {
      return res.status(400).json({
        success: false,
        message: "Size not available",
        availableSizes: Array.from(productSizes.keys()),
      });
    }

    const availableStock = productSizes.get(itemSize);
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

    const existingItem = cart.items.find(
      (item) =>
        item.productId.toString() === productId.toString() &&
        item.itemSize === itemSize
    );

    if (existingItem) {
      if (existingItem.quantity >= availableStock) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock available for size ${itemSize}. Only ${availableStock} in stock.`,
        });
      }
      existingItem.quantity += 1;
    } else {
      cart.items.push({
        productId,
        itemSize,
        quantity: 1,
        price: product.price,
      });
    }

    await cart.save();

    const populatedCart = await Cart.findOne({ userId })
      .populate("items.productId", "name price mainImage")
      .lean();

    return res.status(200).json({ success: true, cart: populatedCart });
  } catch (error) {
    return handleErrors(error, res);
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
    const populatedCart = await Cart.findOne({ userId })
      .populate("items.productId", "name price mainImage")
      .lean();
    return res.status(200).json({
      success: true,
      cart: populatedCart,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// increment or decrement the quantity of an item in the cart
module.exports.updateItemQuantity = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId, itemSize } = req.body;

    if (!productId || !itemSize) {
      return res.status(400).json({
        success: false,
        message: "productId and itemSize are required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.sizes.has(itemSize)) {
      return res.status(400).json({
        success: false,
        message: "Selected size not available",
        availableSizes: Array.from(product.sizes.keys()),
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const cartItem = cart.items.find(
      (item) =>
        item.productId.toString() === productId.toString() &&
        item.itemSize === itemSize
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    if (cartItem.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot decrement, item quantity is already zero.",
      });
    }

    cartItem.quantity -= 1;

    // Optionally remove item if quantity reaches zero
    if (cartItem.quantity === 0) {
      cart.items = cart.items.filter(
        (item) =>
          !(
            item.productId.toString() === productId.toString() &&
            item.itemSize === itemSize
          )
      );
    }

    await cart.save();
    const populatedCart = await Cart.findOne({ userId })
      .populate("items.productId", "name price mainImage")
      .lean();

    return res.status(200).json({
      success: true,
      cart: populatedCart,
    });
  } catch (e) {
    return handleErrors(e, res);
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

    if (!discountCode) {
      return res.status(400).json({
        success: false,
        message: "discountCode is required to remove the discount",
      });
    }

    const discount = await Discount.findOne({
      code: discountCode,
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Discount code not found",
      });
    }

    const userCart = await Cart.findOne({ userId });
    if (!userCart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found for this user",
      });
    }

    // Check if this discount is currently applied
    const discountIndex = userCart.appliedDiscounts.findIndex(
      (d) => d.discountId.toString() === discount._id.toString()
    );

    if (discountIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "This discount is not applied to the cart",
      });
    }

    // Remove the discount
    userCart.appliedDiscounts.splice(discountIndex, 1);

    // Reset totalAfterDiscount to match full total (or you could recalculate)
    userCart.totalAfterDiscount = userCart.total;

    await userCart.save();

    res.json({
      success: true,
      message: "Discount removed successfully",
      cart: userCart.toObject(),
    });
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
