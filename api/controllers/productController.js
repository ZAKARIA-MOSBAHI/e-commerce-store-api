// does the image get deleted when updated ?
const mongoose = require("mongoose");
const Product = require("../models/product");
const { removeFileExtension } = require("../../utils/utils");
// A HELPER FUNCTION TO HANDLE ERRORS
const handleErrors = require("../../utils/errorHandler");
// GET ALL PRODUCTS
module.exports.getAllProducts = async (req, res) => {
  try {
    const result = await Product.find({}, { __v: 0 })
      // populate(fieldname , propertiesToShow) will show the name of the category also
      .populate("categoryId", "name")
      .exec();
    if (result) {
      return res
        .status(200)
        .json({ count: result.length, products: result, success: true });
    }
  } catch (e) {
    handleErrors(e, res);
  }
};
// GET PRODUCT DETAILS BY ID
module.exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Product.findById(id, { __v: 0 }).exec();
    // HANDLING BUISNESS LOGIC ERRORS (errors that are not thrown , or rejected)
    if (!result) {
      // this will be returned if the id format is valid but not found
      return res.status(404).json({ message: "Product not found" });
    } else {
      return res.status(200).json({ success: true, product: result });
    }
  } catch (e) {
    handleErrors(e, res);
  }
};
// CREATE PRODUCT
module.exports.addProduct = async (req, res) => {
  try {
    const { name, price, description, categoryId, stock, sizes } = req.body;
    console.log(req.files);
    console.log(req.body);
    if (!req.files?.mainImage?.[0]) {
      return res.status(400).json({
        success: false,
        message: "Main image is required",
      });
    }
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
        url: `${process.env.BASE_URL}/${mainImage.filename}`,
        altText: removeFileExtension(mainImage.originalname),
      },
      additionalImages: additionalImages.map((file) => ({
        url: `${process.env.BASE_URL}/${mainImage.filename}`,
        altText: removeFileExtension(file.originalname),
      })),
    });
    const result = await productToAdd.save();
    return res.status(201).json({ success: true, product: result });
  } catch (e) {
    handleErrors(e, res);
  }
};
// UPDATE A PRODUCT
module.exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const propertiesToUpdate = {};
    // Handling images update
    if (req.files.mainImage) {
      const newMainImage = {
        url: `${process.env.BASE_URL}/${req.files.mainImage[0].filename}`,
        altText: removeFileExtension(req.files.mainImage[0].originalname),
      };
      propertiesToUpdate.mainImage = newMainImage;
    }
    if (req.files.additionalImages) {
      const newAdditionalImages = req.files.additionalImages.map((image) => ({
        url: `${process.env.BASE_URL}/${image.filename}`,
        altText: removeFileExtension(image.originalname),
      }));
      propertiesToUpdate.additionalImages = newAdditionalImages;
    }

    const allowedFields = ["name", "price", "description", "stock", "sizes"];
    allowedFields.forEach((key) => {
      if (req.body[key] !== undefined) {
        propertiesToUpdate[key] = req.body[key];
      }
    });
    // used findByIdAndUpdate bcs the updateOne func doesn't return the updated document
    const result = await Product.findByIdAndUpdate(
      { _id: id },
      { $set: propertiesToUpdate },
      { new: true, runValidators: true }
      //new: true: Returns the modified document rather than the original
      //runValidators: true: Runs schema validation on update
    ).exec();
    if (!result) {
      // Proper check for null document
      return res.status(404).json({ message: "Product not found" });
    } else {
      return res.status(200).json({ success: true, product: result });
    }
  } catch (e) {
    handleErrors(e, res);
  }
};
// DELETE A PRODUCT
module.exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Product.deleteOne({ _id: id }).exec();

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Product not found" });
    } else {
      return res.status(200).json({ success: true });
    }
  } catch (e) {
    handleErrors(e, res);
  }
};
