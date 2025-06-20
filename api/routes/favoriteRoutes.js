const favoriteRoutes = require("express").Router();
const favoriteController = require("../controllers/favoriteController");
const { authenticate } = require("../middlewares/auth");

// get all favorite products for a user
favoriteRoutes.get("/", authenticate, favoriteController.getFavorites);
// Add a favorite product
favoriteRoutes.post(
  "/:productId",
  authenticate,
  favoriteController.addFavorite
);
// Delete a favorite product
favoriteRoutes.delete(
  "/:productId",
  authenticate,
  favoriteController.removeFavorite
);

module.exports = favoriteRoutes;
