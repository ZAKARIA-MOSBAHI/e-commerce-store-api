const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Category = require("../models/category");
// LIST ALL THE CATEGORIES
router.get("/", (req, res) => {
  Category.find({}, { __v: 0 })
    .exec()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});
// GET CATEGORY BY CATEGORY ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  Category.findById(id, { __v: 0 })
    .exec()
    .then((result) => {
      if (!result) {
        return res.status(404).json({ message: "Category not found" });
      } else {
        res.status(200).json(result);
      }
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});
// CREATE A NEW CATEGORY
router.post("/", (req, res) => {
  const { name, slug } = req.body;
  const newCategory = new Category({
    _id: new mongoose.Types.ObjectId(),
    name,
    slug,
  });
  newCategory
    .save()
    .then((result) => {
      return res.status(201).json({
        message: "category created successfully",
        category: result,
      });
    })
    .catch((e) =>
      res.status(500).json({
        message: e.message,
      })
    );
});
// UPDATE A CATEGORY
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const updatedCategory = {};
  Object.keys(req.body).forEach(
    (key) => (updatedCategory[key] = req.body[key])
  );

  Category.updateOne({ _id: id }, { $set: updatedCategory })
    .then((result) => {
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Category not found" });
      } else if (result.modifiedCount === 0) {
        return res.status(400).json({ message: "Invalid updates" });
      } else {
        return res.status(200).json({
          message: "Category updated successfully",
        });
      }
    })
    .catch((e) =>
      res.status(500).json({
        message: e.message,
      })
    );
});
// DELETE A CATEGORY
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  Category.deleteOne({ _id: id })
    .then((result) => {
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Category not found" });
      } else {
        return res.status(200).json({
          message: "Category deleted successfully",
        });
      }
    })
    .catch((e) =>
      res.status(500).json({
        message: e.message,
      })
    );
});
module.exports = router;
