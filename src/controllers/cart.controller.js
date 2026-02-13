/*TIP : USE MongoDB sessions to run multiple related operations 
(updating the cart, user, and discount) within a single transaction helps ensure consistency. 
If any update fails, the whole transaction is rolled back.*/
const mongoose = require("mongoose");
const Cart = require("../models/cart");
const handleErrors = require("../utils/errorHandler");
const Product = require("../models/product");
const Discount = require("../models/discount");
const User = require("../models/user");
const Order = require("../models/order");

// GET THE CLIENT'S CART
module.exports.getClientCart = async (req, res) => {
  try {
    const { userId } = req.user;
    const userCart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        select: "name price mainImage sizes",
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
// ADD ITEM TO THE CLIENT'S CART and increment quantity if already exists
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
        item.itemSize === itemSize,
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
      .populate("items.productId", "name price mainImage sizes")
      .lean();

    return res.status(200).json({
      success: true,
      cart: populatedCart,
      message: "Product added to cart",
    });
  } catch (e) {
    return {
      success: false,
      message: e?.message || "Failed to add product to cart",
    };
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
        item.itemSize === itemSize,
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
// decrement the quantity of an item in the cart
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
        item.itemSize === itemSize,
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
          ),
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
// Update the size of a cart item, checking stock
module.exports.updateCartItemSize = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId, oldSize, newSize } = req.body;

    if (!productId || !oldSize || !newSize) {
      return res.status(400).json({
        success: false,
        message: "productId, oldSize and newSize are required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const availableSizes = Array.from(product.sizes.keys());

    if (!product.sizes.has(newSize)) {
      return res.status(400).json({
        success: false,
        message: "Selected size not available",
        availableSizes,
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }
    console.log(cart.items[0]);
    const cartItem = cart.items.find(
      (item) =>
        item.productId.toString() === productId.toString() &&
        item.itemSize === oldSize,
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    const availableQty = product.sizes.get(newSize);
    if (cartItem.quantity > availableQty) {
      return res.status(400).json({
        success: false,
        message: `Cannot switch to size ${newSize}, only ${availableQty} items available`,
      });
    }

    const existingNewSizeItem = cart.items.find(
      (item) =>
        item.productId.toString() === productId.toString() &&
        item.itemSize === newSize,
    );

    if (existingNewSizeItem) {
      const totalQty = existingNewSizeItem.quantity + cartItem.quantity;

      if (totalQty > availableQty) {
        return res.status(400).json({
          success: false,
          message: `Cannot merge items: total quantity (${totalQty}) exceeds available stock (${availableQty})`,
        });
      }

      existingNewSizeItem.quantity = totalQty;

      cart.items = cart.items.filter(
        (item) =>
          !(
            item.productId.toString() === productId.toString() &&
            item.itemSize === oldSize
          ),
      );
    } else {
      cartItem.itemSize = newSize;
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
      { new: true },
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
      (d) => d.discountId.toString() === discount._id.toString(),
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

// GET ALL CARTS (ADMIN)
module.exports.getCarts = async (req, res) => {
  try {
    const carts = await Cart.find()
      //populate also the userId prop
      .populate({
        path: "items.productId",
        select: "name price mainImage sizes",
      })
      .populate({
        path: "userId",
        select: "name email",
      })
      .lean();

    return res.status(200).json({
      success: true,
      carts,
      totalCarts: carts.length,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e?.message || "Couldn't get carts!",
    });
  }
};
// DELETE CART (ADMIN)
module.exports.deleteCart = async (req, res) => {
  try {
    const { cartId } = req.params;

    if (!cartId || !mongoose.Types.ObjectId.isValid(cartId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart ID",
      });
    }

    const deletedCart = await Cart.findByIdAndDelete(cartId);

    if (!deletedCart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart deleted successfully",
      cart: deletedCart.toObject(),
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
