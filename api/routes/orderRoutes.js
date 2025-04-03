const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    message: "this route List all orders for the authenticated user.",
  });
});
// GET ORDER DETAILS BY ORDER ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  return res.status(200).json({
    message: `order id is : ${id} , this route Get order details by ID.`,
  });
});

// DELETE AN ORDER (CANCEL IT) BY ORDER ID
router.delete("/:id/cancel", (req, res) => {
  const { id } = req.params;
  return res.status(200).json({
    message: `order id is : ${id} , this route Cancel an order (if status is "pending").`,
  });
});
module.exports = router;
