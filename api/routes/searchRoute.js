const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Fuse = require("fuse.js");
const fuseOptions = {
  keys: ["name"],
  threshold: 0.3,
};

router.post("/", async (req, res) => {
  if (req.body?.query) {
    const searchQuery = req.body.query;
    const data = await Product.find({}, { __v: 0 });
    const fuse = new Fuse(data, fuseOptions);
    const result = fuse.search(searchQuery);
    if (result.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }
    return res.status(200).json({
      results: result.map((r) => r.item),
    });
  } else {
    return res.status(500).json({
      message: "Error: No query provided",
    });
  }
});

module.exports = router;
