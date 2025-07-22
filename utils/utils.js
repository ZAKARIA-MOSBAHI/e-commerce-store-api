const path = require("path");
const jwt = require("jsonwebtoken");
const removeFileExtension = (filename) => {
  const fileNameWithoutExt = path.parse(filename).name.replace(/[^\w\-]/g, "");
  return fileNameWithoutExt;
};
const generateAccessToken = (userId, userRole) => {
  const accessToken = jwt.sign(
    {
      userId,
      role: userRole,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" }
  );

  return accessToken;
};
const generateRefreshToken = (userId, userRole) => {
  const refreshToken = jwt.sign(
    {
      userId,
      role: userRole,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  return refreshToken;
};
const abortWithError = async (res, session, status, message, extra = {}) => {
  await session.abortTransaction();
  session.endSession();
  return res.status(status).json({ success: false, message, ...extra });
};

module.exports = {
  removeFileExtension,
  generateAccessToken,
  generateRefreshToken,
  abortWithError,
};
