const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const loginLimiter = require("../middlewares/limiter");
const { authenticate, authorizeAdmin } = require("../middlewares/auth");
// CREATE A USER
router.post("/signup", userController.signup);

router.post("/login", loginLimiter, userController.login);

// GET USERS (this should be in admin route)
router.get("/", authenticate, authorizeAdmin, userController.getUsers);
// GET CLIENT USER ACCOUNT (used to let him get his data)
router.get("/me", authenticate, userController.getClientUser);

// DELETE A PRODUCT
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  return res.status(200).json({
    message: `user id is : ${id} but it's delete route`,
  });
});

// UPDATE A PRODUCT
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  return res.status(200).json({
    message: `user id is : ${id} but it's update route`,
  });
});
module.exports = router;
