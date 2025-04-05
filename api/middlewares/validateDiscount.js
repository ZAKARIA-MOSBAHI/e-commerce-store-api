const Cart = require("../models/cart");
const Discount = require("../models/discount");

exports.validateDiscount = async (req, res, next) => {
  const { discountCode } = req.body;
  const { userId } = req.user;
  const cart = await Cart.findOne({ userId }).populate("items.productId");
  // Get discount
  const discount = await Discount.findOne({ code: discountCode });

  // Validate discount exists
  if (!discount)
    return res.status(404).json({ error: "Invalid discount code" });

  // Check expiration
  if (new Date() > discount.validUntil) {
    return res.status(400).json({ error: "Discount has expired" });
  }

  // Check usage limits
  if (discount.usedCount >= discount.maxUses) {
    return res.status(400).json({ error: "Discount usage exceeded" });
  }

  // Check user-specific discounts
  if (discount.userSpecific && !discount.userSpecific.equals(user._id)) {
    return res.status(403).json({ error: "Discount not valid for this user" });
  }

  // Check cart minimum value
  if (cart.total < discount.minCartValue) {
    return res.status(400).json({
      error: `Cart must exceed ${discount.minCartValue} to use this discount`,
    });
  }

  // Attach discount to request
  req.validDiscount = discount;
  next();
};
