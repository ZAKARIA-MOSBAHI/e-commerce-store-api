/*TIP : USE MongoDB sessions to run multiple related operations 
(updating the cart, user, and discount) within a single transaction helps ensure consistency. 
If any update fails, the whole transaction is rolled back.*/
const mongoose = require("mongoose");
const Cart = require("../models/cart");
const handleErrors = require("../../utils/errorHandler");
const Product = require("../models/product");
const Discount = require("../models/discount");
const User = require("../models/user");

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

    // Validate product exists
    const product = await Product.findById(productIdObj);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Validate size availability
    const sizeAvailable = product.sizes.find((size) => {
      console.log("size is : " + size);
      return size === itemSize;
    });
    if (!sizeAvailable) {
      return res.status(400).json({
        success: false,
        message: "Size not available",
        availableSizes: product.sizes,
      });
    }

    let updatedCart;

    // Check if item exists
    const existingItem = await Cart.findOne({
      userId,
      "items.productId": productIdObj,
      "items.itemSize": itemSize,
    });

    if (existingItem) {
      // Increment quantity for existing item
      updatedCart = await Cart.findOneAndUpdate(
        {
          userId,
          "items.productId": productIdObj,
          "items.itemSize": itemSize,
        },
        {
          $inc: { "items.$.quantity": 1 },
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate({ path: "items.productId", select: "name price mainImage" });
    } else {
      // Add new item to cart
      updatedCart = await Cart.findOneAndUpdate(
        { userId },
        {
          $push: {
            items: {
              productId: productIdObj,
              itemSize: itemSize,
              quantity: 1,
              price: product.price,
            },
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      ).populate({ path: "items.productId", select: "name  price mainImage" });
    }

    // Recalculate total after update
    const total = updatedCart.items.reduce(
      (sum, item) => sum + item.quantity * item.productId.price,
      0
    );
    // Set the new total
    updatedCart = await Cart.findOneAndUpdate(
      { userId },
      { $set: { total } },
      { new: true }
    ).populate("items.productId", "name price  mainImage");

    return res.status(200).json({
      success: true,
      cart: updatedCart.toObject(),
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

    // Find item quantity
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (i) => i.productId.equals(productIdObj) && i.itemSize === itemSize
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    let updatedCart;

    if (item.quantity > 1) {
      // Decrement quantity
      updatedCart = await Cart.findOneAndUpdate(
        {
          userId,
          "items.productId": productIdObj,
          "items.itemSize": itemSize,
        },
        {
          $inc: { "items.$.quantity": -1 },
        },
        { new: true }
      ).populate({ path: "items.productId", select: "name price mainImage" });
    } else {
      // Remove item completely
      updatedCart = await Cart.findOneAndUpdate(
        { userId },
        {
          $pull: {
            items: {
              productId: productIdObj,
              itemSize: itemSize,
            },
          },
        },
        { new: true }
      ).populate({ path: "items.productId", select: "name price mainImage" });
    }

    // Recalculate total after update
    const total = updatedCart.items.reduce(
      (sum, item) => sum + item.quantity * item.productId.price,
      0
    );

    // Set the new total
    updatedCart = await Cart.findOneAndUpdate(
      { userId },
      { $set: { total } },
      { new: true }
    ).populate({ path: "items.productId", select: "name price mainImage" });

    return res.status(200).json({
      success: true,
      cart: updatedCart.toObject(),
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
      [
        { $set: { items: [] } },
        { $set: { total: 0 } },
        { $set: { discountTotal: 0 } },
        { $set: { appliedDiscounts: [] } },
      ],
      { new: true }
    );

    return res.status(200).json({
      success: true,
      cart: {
        _id: clearedCart._id,
        userId: clearedCart.userId,
        items: [],
        total: 0,
        createdAt: clearedCart.createdAt,
        updatedAt: clearedCart.updatedAt,
        appliedDiscounts: [],
        discountTotal: 0,
      },
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// APPLY DISCOUNT TO THE CLIENT'S CART
module.exports.applyDiscount = async (req, res) => {
  try {
    const { userId } = req.user;
    const discount = req.validDiscount;
    const userCart = await Cart.findOne({ userId });

    let discountAmount = 0;
    switch (discount.type) {
      case "percentage":
        discountAmount = userCart.total * (discount.value / 100);
        if (discount.maxDiscount) {
          discountAmount = Math.min(discountAmount, discount.maxDiscount);
        }
        break;

      case "fixed":
        discountAmount = discount.value;
        break;

      case "free_shipping":
        console.log("free shipping");
        break;
    }
    console.log("discount amount is : ", discountAmount);
    const updatedCart = await Cart.findByIdAndUpdate(
      userCart._id,
      {
        $push: {
          appliedDiscounts: {
            code: discount.code,
            discountId: discount._id,
            amount: discountAmount,
          },
        },
        $inc: { discountTotal: userCart.total - discountAmount },
      },
      { new: true }
    );
    // Update user's used discounts
    await User.findByIdAndUpdate(userId, {
      $push: {
        usedDiscounts: {
          discount: discount._id,
          usedAt: new Date(),
        },
      },
    });

    // Update discount usage count
    await Discount.findByIdAndUpdate(discount._id, {
      $inc: { usedCount: 1 },
    });

    res.json(updatedCart);
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
