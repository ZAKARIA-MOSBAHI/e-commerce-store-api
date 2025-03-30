const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Subcategory = require("../models/subcategory");
// LIST ALL THE CATEGORIES
router.get("/", (req, res) => {
  Subcategory.find({}, { __v: 0 })
    .exec()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});
// GET Subcategory BY Subcategory ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  Subcategory.findById(id, { __v: 0 })
    .exec()
    .then((result) => {
      if (!result) {
        return res.status(404).json({ message: "Subcategory not found" });
      } else {
        res.status(200).json(result);
      }
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});
// CREATE A NEW Subcategory
router.post("/", (req, res) => {
  const { name, slug } = req.body;
  const newSubcategory = new Subcategory({
    _id: new mongoose.Types.ObjectId(),
    name,
    slug,
  });
  newSubcategory
    .save()
    .then((result) => {
      return res.status(201).json({
        message: "Subcategory created successfully",
        Subcategory: result,
      });
    })
    .catch((e) =>
      res.status(500).json({
        message: e.message,
      })
    );
});
// UPDATE A Subcategory
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const updatedSubcategory = {};
  Object.keys(req.body).forEach(
    (key) => (updatedSubcategory[key] = req.body[key])
  );

  Subcategory.updateOne({ _id: id }, { $set: updatedSubcategory })
    .then((result) => {
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Subcategory not found" });
      } else if (result.modifiedCount === 0) {
        return res.status(400).json({ message: "Invalid updates" });
      } else {
        return res.status(200).json({
          message: "Subcategory updated successfully",
        });
      }
    })
    .catch((e) =>
      res.status(500).json({
        message: e.message,
      })
    );
});
// DELETE A Subcategory
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  Subcategory.deleteOne({ _id: id })
    .then((result) => {
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Subcategory not found" });
      } else {
        return res.status(200).json({
          message: "Subcategory deleted successfully",
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
