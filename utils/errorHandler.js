// utils/errorHandler.js
const handleErrors = (err, res) => {
  // Always log the error
  console.error("Error:", err);

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Failed",
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  // Invalid ID format
  if (err.name === "CastError") {
    return res.status(400).json({
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      message: `${field} must be unique`,
    });
  }

  // Default server error
  res.status(500).json({
    message: "Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

module.exports = handleErrors;
