const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
// configs 
const connectDB = require("./src/config/db");
const corsOptions = require("./src/config/cors");
 // ROUTER
const routes = require("./src/routes");
app.use("/" , routes);
//DATABASE CONNECTION
connectDB();
// MIDDLEWARES
app.use(corsOptions );
app.use(morgan("dev")); // process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use("/uploads" , express.static("uploads"));// constants?.UPLOADS?.UPLOAD_DIR || "uploads";
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// HEADERS
app.use((req, res, next) => {
  // this middleware intercepts every request and adds a header
  res.header("Access-Control-Allow-Origin", "*"); //allows requests from any domain
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept , Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});
 
// ERROR HANDLERS
app.use((req, res, next) => {
  // this handler will be called when no route is matched
  const error = new Error("Not found");
  error.status = 404;
  next(error); // this will call the error handler
});
app.use((err, req, res, next) => {
  // this handler will be called when an error occurs in the database
  // because the database will not call any route
  res.status(err.status || 500).json({ error: { message: err.message } });
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});