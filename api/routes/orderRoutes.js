const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.get("/", orderController.getOrders);
// GET ORDER DETAILS BY ORDER ID
router.get("/:id", orderController.getOrderById);
// DELETE AN ORDER (CANCEL IT) BY ORDER ID
router.delete("/cancel/:id", orderController.cancelOrder);
// UPDATE AN ORDER BY ORDER ID
router.delete("/update/:id", orderController.updateOrder);
//GET THE LOGGING USER'S ORDERS
router.get("/me", orderController.getClientOrders);
//GET THE LOGGING USER'S ORDER BY ORDER ID
router.get("/me/:id", orderController.getClientOrders);
//CANCEL THE LOGGING USER'S ORDER BY ORDER ID
router.delete("/me/cancel/:id", orderController.cancelClientOrder);
// CHECKOUT ROUTE , CONVERTS THE CART TO AN ORDER
router.post("/checkout", orderController.checkout);
module.exports = router;
