const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { authenticate } = require("../middlewares/auth");
const { validateDiscount } = require("../middlewares/validateDiscount");
// GET THE USER'S CURRENT CART
router.get("/me", authenticate, cartController.getClientCart);

// ADD AN ITEM TO THE CLIENT'S CART
router.post("/me/items", authenticate, cartController.addItemsToClientCart);
// Update the items quantity in the client's cart
router.put("/me/items/update", authenticate, cartController.updateItemQuantity);

// DELETE AN ITEM FROM THE CLIENT'S CART
router.delete(
  "/me/items",
  authenticate,
  cartController.deleteItemFromClientCart
);
// CLEAR THE CLIENT'S CART
router.delete("/me", authenticate, cartController.clearClientCart);
// APPLY A DISCOUNT TO THE CART
router.post(
  "/apply-discount",
  authenticate,

  cartController.applyDiscount
);
// REMOVE A DISCOUNT FROM THE CART
router.post("/remove-discount", authenticate, cartController.removeDiscount);

// CHECKOUT ROUTE , CONVERTS THE CART TO AN ORDER
router.post("/checkout", authenticate, cartController.checkout);

module.exports = router;
