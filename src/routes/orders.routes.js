const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// GET ORDER DETAILS BY ORDER ID
router.get("/me/:id", authenticate, orderController.getClientOrderById);
//GET THE LOGGING USER'S ORDERS
router.get("/me", authenticate, orderController.getClientOrders);
//CANCEL THE LOGGING USER'S ORDER BY ORDER ID
router.delete(
  "/me/cancel/:id",
  authenticate,
  orderController.cancelClientOrder,
);
// CREATE AN ORDER (Client)
router.post("/me", authenticate, orderController.createClientOrder);

// GET ALL ORDERS (ADMIN)
router.get("/", authenticate, authorizeAdmin, orderController.getOrders);
// GET ORDER BY ID (ADMIN)
router.get("/:id", authenticate, authorizeAdmin, orderController.getOrderById);
// CANCEL AN ORDER BY ORDER ID (ADMIN)
router.delete(
  "/cancel/:id",
  authenticate,
  authorizeAdmin,
  orderController.cancelOrder,
);
// UPDATE AN ORDER BY ORDER ID
router.put(
  "/update/:id/confirm",
  authenticate,
  authorizeAdmin,
  orderController.confirmOrder,
);
router.put(
  "/update/:id/ship",
  authenticate,
  authorizeAdmin,
  orderController.shipOrder,
);
router.put(
  "/update/:id/deliver",
  authenticate,
  authorizeAdmin,
  orderController.deliverOrder,
);

module.exports = router;
