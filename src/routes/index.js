const router = require("express").Router();

const usersRoutes = require("./users.routes");
const productsRoutes = require("./products.routes");
const cartsRoutes = require("./carts.routes");
const ordersRoutes = require("./orders.routes");
const categoriesRoutes = require("./categories.routes");
const subcategoriesRoutes = require("./subcategories.routes");
const addressRoutes = require("./address.routes");
const refreshTokenRoutes = require("./refresh-token.routes");
const searchRoutes = require("./search.routes");
const favoritesRoutes = require("./favorites.routes");
const notificationRoutes = require("./notification.routes");

router.use("/users", usersRoutes);
router.use("/products", productsRoutes);
router.use("/carts", cartsRoutes);
router.use("/orders", ordersRoutes);
router.use("/categories", categoriesRoutes);
router.use("/subcategories", subcategoriesRoutes);
router.use("/address", addressRoutes);
router.use("/refresh-token", refreshTokenRoutes);
router.use("/search", searchRoutes);
router.use("/favorites", favoritesRoutes);
router.use("/notifications", notificationRoutes);

module.exports = router;
