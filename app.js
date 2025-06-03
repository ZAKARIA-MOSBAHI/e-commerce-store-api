const express = require("express");
const app = express();
// importing morgan middleware : morgan is a logger middleware
const morgan = require("morgan");
const cors = require("cors");
// importing body-parser middleware : body-parser is a middleware to parse the body of the request
// because the request body is harder to read
const bodyParser = require("body-parser");
// mongodb
const mongoose = require("mongoose");
// ROUTERS
const productRouter = require("./api/routes/productRoutes");
const usersRouter = require("./api/routes/userRoutes");
const cartRouter = require("./api/routes/cartRoutes");
const ordersRouter = require("./api/routes/orderRoutes");
const categoriesRouter = require("./api/routes/categoriyRoutes");
const subcategoriesRouter = require("./api/routes/subcategoryRoutes");
const addressRouter = require("./api/routes/addressRoutes");
const refreshTokenRouter = require("./api/routes/refreshTokenRoute");
const searchRoute = require("./api/routes/searchRoute");
//DATABASE CONNECTION
mongoose
  .connect("mongodb://localhost:27017/store", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to MongoDB.");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
// MIDDLEWARES
// Enable CORS with custom configuration
app.use(
  cors({
    origin: "*", // Allow frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"], // Allow specific headers (including your custom header)
  })
);
app.use(morgan("dev"));
app.use(express.static("uploads")); // this middleware make the uploads file accessible for public (read only)
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
// LISTENERS
app.use("/users", usersRouter);
app.use("/products", productRouter);
app.use("/carts", cartRouter);
app.use("/orders", ordersRouter);
app.use("/categories", categoriesRouter);
app.use("/subcategories", subcategoriesRouter);
app.use("/address", addressRouter);
app.use("/refresh-token", refreshTokenRouter);
app.use("/search", searchRoute);

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
module.exports = app;
// create admin routes later
