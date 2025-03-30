const express = require("express");
const router = express.Router();

// GET THE USER'S CURRENT CART
router.get("/", (req, res) => {
  return res.status(200).json({
    message: "cart retrieved successfully",
  });
});

// ADD AN ITEM TO THE CART
router.post("/items", (req, res) => {
  return res.status(200).json({
    message: "this route is for adding items to the cart (post)",
  });
});
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
