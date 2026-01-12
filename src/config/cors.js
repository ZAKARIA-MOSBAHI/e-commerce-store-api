const cors = require('cors');

const corsOptions = {
   origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-refresh-token",
    "Accept"
  ]
    
 ,
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400 // 24 hours in seconds
};

module.exports = cors(corsOptions);