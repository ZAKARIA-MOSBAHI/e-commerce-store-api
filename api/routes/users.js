const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    message: "users list",
  });
});
// GET PRODUCT BY ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  return res.status(200).json({
    message: `user id is : ${id}`,
  });
});
// ADD A PRODUCT
router.post("/", (req, res) => {
  return res.status(200).json({
    message: "post request to users route",
  });
});

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
