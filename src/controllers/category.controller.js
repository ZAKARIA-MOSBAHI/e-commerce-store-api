const Category = require("../models/category");
const Product = require("../models/product");
module.exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "categoryId",
          as: "products",
        },
      },
      {
        $addFields: {
          productsCount: { $size: "$products" },
        },
      },
      {
        $project: {
          __v: 0,
          "products.__v": 0,
          "products.description": 0,
          "products.categoryId": 0,
          "products.mainImage": 0,
          "products.additionalImages": 0,
          "products.sizes": 0,
          "products.gender": 0,
          "products.badge": 0,
          "products.createdAt": 0,
          "products.updatedAt": 0,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id, { __v: 0 }).lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.createCategory = async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!slug || !slug.trim()) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    // Prevent duplicates
    const existing = await Category.findOne({ slug: slug.trim() });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists",
      });
    }

    const newCategory = await Category.create({
      name: name.trim(),
      slug: slug.trim(),
    });
    const categoryObject = newCategory.toObject();

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: { ...categoryObject, products: [], productsCount: 0 },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }
      updateData.name = name.trim();
    }

    if (slug !== undefined) {
      if (!slug.trim()) {
        return res.status(400).json({
          success: false,
          message: "Slug cannot be empty",
        });
      }

      // Prevent duplicate slug (excluding current category)
      const existing = await Category.findOne({
        slug: slug.trim(),
        _id: { $ne: id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Slug already exists",
        });
      }

      updateData.slug = slug.trim();
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const productsCount = await Product.countDocuments({
      categoryId: id,
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete category because it contains products. Remove or reassign them first.",
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
