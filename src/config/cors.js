const cors = require('cors');

const corsOptions = {
  origin: "*", // Allow frontend's origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "x-refresh-token",
    "Origin", 
    "X-Requested-With", 
    "Accept"
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400 // 24 hours in seconds
};

module.exports = cors(corsOptions);