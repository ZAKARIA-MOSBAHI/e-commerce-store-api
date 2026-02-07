// does the image get deleted when updated ?
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Product = require("../models/product");
const Category = require("../models/category");
const { removeFileExtension } = require("../utils/utils");
// A HELPER FUNCTION TO HANDLE ERRORS
const handleErrors = require("../utils/errorHandler");
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
    const result = await Product.findById(id, { __v: 0 })
      .populate("categoryId")
      .exec();
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
    const { name, price, description, categoryId, gender, badge } = req.body;

    const sizes =
      typeof req.body.sizes === "string"
        ? JSON.parse(req.body.sizes)
        : req.body.sizes;

    // the stock will be calculated automatically from the sizes

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

      categoryId,
      sizes,
      gender,
      badge,
      mainImage: {
        url: `/uploads/${mainImage.filename}`,
        altText: removeFileExtension(mainImage.originalname),
      },
      additionalImages: additionalImages.map((file) => ({
        url: `/uploads/${file.filename}`,
        altText: removeFileExtension(file.originalname),
      })),
    });
    const result = await productToAdd.save();
    console.log(" Product created:", result);
    return res.status(201).json({
      success: true,
      product: result,
      message: "Product Created Successfully!",
    });
  } catch (e) {
    handleErrors(e, res);
  }
};
// UPDATE A PRODUCT
// what do you think it's working and updating and cleaning
module.exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { categoryId } = req.body;

    const allowedFields = [
      "name",
      "description",
      "sizes",
      "price",
      "categoryId",
    ];
    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product Not Found!" });
    }
    let category;
    if (categoryId) {
      console.log("category id : ", categoryId);
      category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      product.categoryId = categoryId;
    }
    allowedFields.forEach((f) => {
      const fieldValue = req.body[f];
      console.log("field ", f, "value ", fieldValue);
      if (fieldValue !== "" && fieldValue !== undefined) {
        if (f === "categoryId") return;
        if (f === "sizes") {
          product[f] = JSON.parse(fieldValue);
          return;
        }
        product[f] = fieldValue;
      }
    });
    let removedImages = req.body.removedImages;
    console.log("removed images ", removedImages);
    if (removedImages) {
      removedImages = JSON.parse(removedImages);
      removedImages.forEach((ri) => {
        const relativePath = ri.replace(/^\/+/, ""); // remove leading /
        const absolutePath = path.join(process.cwd(), relativePath);

        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath);
        }
      });
    }
    const isMainImg = req.files?.mainImage?.length > 0;
    if (isMainImg) {
      const mainImage = req.files?.mainImage[0];
      console.log("main image ", mainImage);
      product.mainImage = {
        url: `/uploads/${mainImage.filename}`,
        altText: removeFileExtension(mainImage.originalname),
      };
    }
    const additionalImages = req.files?.additionalImages;
    console.log("additional images ", additionalImages);

    if (additionalImages?.length > 0) {
      let additionalImagesWithPaths = [];
      additionalImages.forEach((ai) => {
        additionalImagesWithPaths.push({
          url: `/uploads/${ai.filename}`,
          altText: removeFileExtension(ai.originalname),
        });
      });
      product.additionalImages = additionalImagesWithPaths;
    }

    await product.save();
    const updatedProduct = await Product.findById(product._id)
      .populate("categoryId")
      .lean();
    return res.status(200).json({
      success: true,
      updatedProduct,
      message: "Product updated successfully!",
    });
  } catch (e) {
    handleErrors(e, res);
  }
};
// DELETE A PRODUCT

module.exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).exec();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const images = [];

    images.push(product.mainImage.url);
    images.push(...product.additionalImages.map((img) => img.url));

    images.forEach((imgPath) => {
      const absolutePath = path.join(process.cwd(), imgPath);

      if (fs.existsSync(absolutePath)) {
        fs.unlink(absolutePath, (err) => {
          if (err) {
            console.error("Failed to delete image:", absolutePath, err);
          }
        });
      }
    });

    await Product.deleteOne({ _id: id }).exec();

    return res
      .status(200)
      .json({ success: true, message: "Product Deleted Successfully!" });
  } catch (e) {
    handleErrors(e, res);
  }
};

module.exports.getFilteredProducts = async (req, res) => {
  try {
    const { category, gender, size, price } = req.body;

    const pipeline = [];

    // JOIN category
    pipeline.push({
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    });

    pipeline.push({ $unwind: "$category" });

    // FILTER
    const match = {};

    if (category) {
      match["category.slug"] = category;
    }

    if (gender) {
      match["gender"] = gender;
    }

    if (size) {
      match["sizes"] = size;
    }

    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    // SORT
    if (price === "low to high" || price === "high to low") {
      const sortDirection = price === "low to high" ? 1 : -1;
      pipeline.push({ $sort: { price: sortDirection } });
    }

    console.log(
      "Starting aggregation with pipeline:",
      JSON.stringify(pipeline),
    );
    const filteredProducts = await Product.aggregate(pipeline);
    console.log("Aggregation done, returning results");

    res.status(200).json({ success: true, filteredProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
