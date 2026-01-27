const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { authenticate } = require("../middleware/auth");

router.get("/", orderController.getOrders);
// GET ORDER DETAILS BY ORDER ID
router.get("/:id", orderController.getOrderById);
// CREATE AN ORDER (Client)
router.post("/me", authenticate, orderController.createClientOrder);
// DELETE AN ORDER (CANCEL IT) BY ORDER ID
router.delete("/cancel/:id", orderController.cancelOrder);
// UPDATE AN ORDER BY ORDER ID
router.delete("/update/:id", orderController.updateOrder);
//GET THE LOGGING USER'S ORDERS
router.get("/me", authenticate, orderController.getClientOrders);
//GET THE LOGGING USER'S ORDER BY ORDER ID
router.get("/me/:id", orderController.getClientOrders);
//CANCEL THE LOGGING USER'S ORDER BY ORDER ID
router.delete("/me/cancel/:id", orderController.cancelClientOrder);

module.exports = router;
