const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/category.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// LIST ALL THE CATEGORIES
router.get("/", categoryController.getCategories);
// GET CATEGORY BY CATEGORY ID
router.get("/:id", categoryController.getCategoryById);
// CREATE A NEW CATEGORY
router.post(
  "/",
  authenticate,
  authorizeAdmin,
  categoryController.createCategory,
);
// UPDATE A CATEGORY
router.put(
  "/:id",
  authenticate,
  authorizeAdmin,
  categoryController.updateCategory,
);
// DELETE A CATEGORY
router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  categoryController.deleteCategory,
);
module.exports = router;
