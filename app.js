const express = require("express");
const app = express();
// importing morgan middleware : morgan is a logger middleware
const morgan = require("morgan");
// importing body-parser middleware : body-parser is a middleware to parse the body of the request
// because the request body is harder to read
const bodyParser = require("body-parser");
// mongodb
const mongoose = require("mongoose");
// ROUTERS
const productRouter = require("./api/routes/products");
const usersRouter = require("./api/routes/users");
const cartRouter = require("./api/routes/cart");
const ordersRouter = require("./api/routes/orders");
const categoriesRouter = require("./api/routes/categories");
const subcategoriesRouter = require("./api/routes/subcategories");
const addressRouter = require("./api/routes/address");
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
app.use("/cart", cartRouter);
app.use("/orders", ordersRouter);
app.use("/categories", categoriesRouter);
app.use("/subcategories", subcategoriesRouter);
app.use("/address", addressRouter);
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
