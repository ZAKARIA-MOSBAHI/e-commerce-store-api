const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/product");
const multer = require("multer");
const { removeFileExtension } = require("../../utils/utils");
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

router.get("/", (req, res) => {
  Product.find({}, { __v: 0 })
    // populate(fieldname , propertiesToShow) will show the name of the category also
    .populate("categoryId", "name")
    .exec()
    .then((products) => {
      // this will return [] if no data found
      console.log(products);
      return res.status(200).json(products);
    })
    .catch((err) => res.status(500).json({ message: err }));
});
// GET PRODUCT BY ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  Product.findById(id, { __v: 0 })
    .exec()
    .then((product) => {
      if (!product) {
        // this will be returned if the id format is valid but not found
        return res.status(404).json({ message: "Product not found" });
      }
      console.log(product);
      return res.status(200).json(product);
    })
    .catch((err) => res.status(500).json({ message: err })); // this will be returned if the id format is invalid
});
// ADD A PRODUCT
router.post(
  "/",
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "additionalImages", maxCount: 4 },
  ]),
  (req, res) => {
    const { name, price, description, categoryId, stock, sizes } = req.body;
    const mainImage = req.files["mainImage"][0];
    const additionalImages = req.files["additionalImages"];
    const productToAdd = new Product({
      _id: new mongoose.Types.ObjectId(),
      name,
      price,
      description,
      stock,
      categoryId,
      sizes,
      mainImage: {
        url: `http:/localhost:3000/${mainImage.filename}`,
        altText: removeFileExtension(mainImage.originalname),
      },
      additionalImages: additionalImages.map((file) => ({
        url: `http:/localhost:3000/${file.filename}`,
        altText: removeFileExtension(file.originalname),
      })),
    });
    // saving the product in the database
    productToAdd
      .save()
      .then((result) => {
        return res.status(201).json({
          product: result,
        });
      })
      .catch((e) => {
        return res.status(500).json({ message: e.message });
      });
  }
);

// DELETE A PRODUCT
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  Product.deleteOne({ _id: id })
    .exec()
    .then((result) => {
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Product not found" });
      } else {
        return res
          .status(200)
          .json({ message: "Product deleted successfully" });
      }
    })
    .catch((e) => res.status(500).json(e));
});

// UPDATE A PRODUCT
router.patch(
  "/:id",
  (req, res, next) => {
    // Wrap the Multer middleware to catch errors
    upload.fields([
      { name: "mainImage", maxCount: 1 },
      { name: "additionalImages", maxCount: 4 },
    ])(req, res, function (err) {
      if (err) {
        if (err instanceof multer.MulterError) {
          // For example, if the additionalImages files exceed maxCount:
          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
              message:
                "Too many files uploaded for additionalImages. Maximum 4 files allowed.",
            });
          }
          return res.status(400).json({ message: err.message });
        }
        return res
          .status(500)
          .json({ message: "Server error during file upload." });
      }
      // No error, pass control to the next middleware/handler
      next();
    });
  },
  (req, res) => {
    const { id } = req.params;
    const propertiesToUpdate = {};
    console.log(req.files);

    // Handling images update
    if (req.files.mainImage) {
      const newMainImage = {
        url: `http://localhost:3000/${req.files.mainImage[0].filename}`,
        altText: removeFileExtension(req.files.mainImage[0].originalname),
      };
      propertiesToUpdate.mainImage = newMainImage;
    }
    if (req.files.additionalImages) {
      const newAdditionalImages = req.files.additionalImages.map((image) => ({
        url: `http://localhost:3000/${image.filename}`,
        altText: removeFileExtension(image.originalname),
      }));
      propertiesToUpdate.additionalImages = newAdditionalImages;
    }

    // Merge additional form fields
    Object.keys(req.body).forEach((key) => {
      propertiesToUpdate[key] = req.body[key];
    });

    Product.updateOne({ _id: id }, { $set: propertiesToUpdate })
      .exec()
      .then((result) => {
        if (result.modifiedCount === 0) {
          return res.status(404).json({ message: "Product not found" });
        }
        return res
          .status(201)
          .json({ message: "Product updated successfully" });
      })
      .catch((e) => res.status(500).json({ message: e.message }));
  }
);
module.exports = router;
