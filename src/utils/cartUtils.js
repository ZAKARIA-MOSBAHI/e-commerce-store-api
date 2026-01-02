// this function update the discount total after removing or adding an item to the cart
const updateCartTotalAfterDiscount = (cart, operation, value) => {
  if (cart.totalAfterDiscount == null) {
    cart.totalAfterDiscount = 0;
  }

  if (typeof value !== "number" || value < 0) {
    throw new Error("Value must be a non-negative number");
  }

  if (operation === "add") {
    cart.totalAfterDiscount += value;
  } else if (operation === "subtract") {
    cart.totalAfterDiscount = Math.max(0, cart.totalAfterDiscount - value);
  } else {
    throw new Error(`Invalid operation "${operation}"`);
  }

  return cart.totalAfterDiscount;
};

export { updateCartTotalAfterDiscount };
