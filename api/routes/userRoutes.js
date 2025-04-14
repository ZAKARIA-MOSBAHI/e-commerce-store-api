const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const loginLimiter = require("../middlewares/limiter");
const { authenticate, authorizeAdmin } = require("../middlewares/auth");

// CREATE A USER (only clients) , admin accounts are created in the database manually
router.post("/signup", userController.signup);
// LOGIN FOR BOTH CLIENTS AND ADMIN
router.post("/login",  userController.login);

// GET USERS (only admin) ,
router.get("/", authenticate, authorizeAdmin, userController.getUsers);

// GET CLIENT USER ACCOUNT (used to let him get his data)
router.get("/me", authenticate, userController.getClientUser);
// GET USER BY ID (only admin) ,
router.get("/:id", authenticate, authorizeAdmin, userController.getUserById);

// DELETE CLIENT USER ACCOUNT (only the user himself can delete his account)
router.delete("/delete", authenticate, userController.deleteClientUser);
// DELETE  A USER   (only admin)
router.delete(
  "/delete/:id",
  authenticate,
  authorizeAdmin,
  userController.deleteUser
);

// UPDATE CLIENT USER ACCOUNT (only the user himself can update his account)
router.put("/update", authenticate, userController.updateClientUser);
// UPDATE A USER (only admin)
router.put(
  "/update/:id",
  authenticate,
  authorizeAdmin,
  userController.updateUser
);

module.exports = router;
