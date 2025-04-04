const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { authenticate } = require("../middlewares/auth");
// GET THE USER'S CURRENT CART
router.get("/me", authenticate, cartController.getClientCart);

// ADD AN ITEM TO THE CLIENT'S CART
router.post("/me/items", authenticate, cartController.addItemsToClientCart);
// APPLY A DISCOUNT TO THE CART
router.post("/apply-discount", (req, res) => {
  return res.status(200).json({
    message: "this route applies a discount to the cart (post)",
  });
});
// TURN THE CART INTO AN ORDER
router.post("/checkout", (req, res) => {
  return res.status(200).json({
    message: "this route turns the cart into an order (post)",
  });
});

// DELETE AN ITEM FROM THE CART
router.delete("/items/:id", (req, res) => {
  const { id } = req.params;
  return res.status(200).json({
    message: `cart item id is : ${id} , this route deletes the item`,
  });
});

module.exports = router;
