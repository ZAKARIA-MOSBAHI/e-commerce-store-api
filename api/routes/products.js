const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/product");
const multer = require("multer");
const { removeFileExtension } = require("../../utils/utils");
const ProductController = require("../controllers/productController");
const { authenticate, authorizeAdmin } = require("../middlewares/auth");
const storage = multer.diskStorage({
  // multer will execute this functions whenever a file is received
  destination: (req, file, callback) => {
    //This function determines the directory where the uploaded files will be stored.
    callback(null, "./uploads/"); // it returns file not found
  },
  //This function controls how the uploaded files are named when they are saved.
  filename: (req, file, callback) => {
    // the product name can't have special chars like !, @, #, : , etc
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const name = `${timestamp}-${file.originalname}`;
    callback(null, name);
  },
});
// filter function to validate the incoming file
const fileFilters = (req, file, callback) => {
  // accept only ".jpeg/png"
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    // this will store the file
    callback(null, true);
  } else {
    // this will reject the file and return an error , bcs the first param is used to send errors
    callback(new Error("File is not jpg or png"), false);
  }
};
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5000000, // 5MB
  },
  fileFilter: fileFilters,
});

router.get("/", authenticate, ProductController.getAllProducts);
// GET PRODUCT BY ID
router.get("/:id", authenticate, ProductController.getProductById);
// ADD A PRODUCT
router.post(
  "/",
  authenticate,
  authorizeAdmin,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "additionalImages", maxCount: 4 },
  ]),
  ProductController.addProduct
);

// DELETE A PRODUCT
router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  ProductController.deleteProduct
);

// UPDATE A PRODUCT
router.put(
  "/:id",
  (req, res, next) => {
    // Wrap the Multer middleware to catch errors
    upload.fields([
      { name: "mainImage", maxCount: 1 },
      { name: "additionalImages", maxCount: 4 },
    ])(req, res, function (err) {
      if (err) {
        if (err instanceof multer.MulterError) {
          const errors = {
            LIMIT_UNEXPECTED_FILE:
              "Too many files for additionalImages (max 4)",
            LIMIT_FILE_SIZE: "File too large (max 5MB)",
            LIMIT_FILE_COUNT: "Too many files",
          };
          return res.status(400).json({
            success: false,
            message: errors[err.code] || "File upload error",
          });
        }
        return res.status(500).json({
          success: false,
          message: "Server error during file upload",
        });
      }
      // No error, pass control to the next middleware/handler
      next();
    });
  },
  ProductController.updateProduct
);
module.exports = router;
