// Add rate limiting for login attempts
const rateLimit = require("express-rate-limit");
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes).
  message: {
    message: "Too many login attempts. Please try again later.",
  },
});

module.exports = loginLimiter;
