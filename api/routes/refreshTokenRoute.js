const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/utils");
router.get("/", async (req, res) => {
  const refreshToken = req.headers["x-refresh-token"];
  if (!refreshToken) {
    console.log("llll");
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log("decoded", decoded);
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("dfdf");
      return res.status(401).json({ message: "Unauthorized" });
    }
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id, user.role);
    await User.findByIdAndUpdate(
      user._id,
      { refreshToken: newRefreshToken },
      { new: true }
    );
    res
      .status(200)
      .json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        name: "refreshTokenExpired",
        message: "Refresh token expired",
      });
    }
    return res.status(500).json({ message: err.message });
  }
});
module.exports = router;
