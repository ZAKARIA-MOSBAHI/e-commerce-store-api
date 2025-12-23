// seed.js
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
require("dotenv").config();
const bcrypt = require("bcrypt");

// Models
const User = require("../api/models/user");
const Address = require("../api/models/address");
const Category = require("../api/models/category");
const Subcategory = require("../api/models/subcategory");
const Product = require("../api/models/product");
const Discount = require("../api/models/discount");
const Cart = require("../api/models/cart");
const Favorite = require("../api/models/favorite");
const Order = require("../api/models/order");

async function seedDatabase() {
  try {
    const URI = process.env.MONGO_URI || "mongodb://localhost:27017/store";
    await mongoose.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");

    // ---- USERS ----
    const hashedPassword = await bcrypt.hash("password123", 12);

    if ((await User.countDocuments()) === 0) {
      const admin = await User.create({
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
      });

      const users = [];
      for (let i = 0; i < 5; i++) {
        users.push({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: hashedPassword,
          role: "user",
        });
      }
      await User.insertMany(users);
      console.log("Users seeded");
    }

    // ---- CATEGORIES ----
    if ((await Category.countDocuments()) === 0) {
      const categories = await Category.insertMany([
        { name: "Shoes", slug: "shoes" },
        { name: "Clothes", slug: "clothes" },
        { name: "Accessories", slug: "accessories" },
      ]);
      console.log("Categories seeded");

      // ---- SUBCATEGORIES ----
      const subcategories = [];
      categories.forEach((cat) => {
        subcategories.push(
          { _id: new mongoose.Types.ObjectId(), name: `${cat.name} Sub1`, slug: `${cat.slug}-sub1`, categoryId: cat._id },
          { _id: new mongoose.Types.ObjectId(), name: `${cat.name} Sub2`, slug: `${cat.slug}-sub2`, categoryId: cat._id }
        );
      });
      await Subcategory.insertMany(subcategories);
      console.log("Subcategories seeded");
    }

    // ---- DISCOUNTS ----
    if ((await Discount.countDocuments()) === 0) {
      await Discount.insertMany([
        { code: "WELCOME10", type: "percentage", value: 10 },
        { code: "FLAT5", type: "fixed", value: 5 },
      ]);
      console.log("Discounts seeded");
    }

    // ---- PRODUCTS ----
    if ((await Product.countDocuments()) === 0) {
      const shoesCategory = await Category.findOne({ slug: "shoes" });
      const clothesCategory = await Category.findOne({ slug: "clothes" });

      const products = [
        {
          name: "Running Shoes",
          price: 120,
          mainImage: { url: faker.image.urlPicsumPhotos({ width: 200, height: 200 }), altText: "Running Shoes" },
          categoryId: shoesCategory._id,
          gender: "men",
          sizes: { L: 5, XL: 10 },
        },
        {
          name: "T-Shirt",
          price: 25,
          mainImage: { url: faker.image.urlPicsumPhotos({ width: 200, height: 200 }), altText: "T-Shirt" },
          categoryId: clothesCategory._id,
          gender: "neutral",
          sizes: { S: 10, M: 15, L: 5 },
        },
      ];
      await Product.insertMany(products);
      console.log("Products seeded");
    }

    // ---- ADDRESSES ----
    if ((await Address.countDocuments()) === 0) {
      const users = await User.find();
      const addresses = users.map((user) => ({
        userId: user._id,
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.countryCode(),
        zipCode: faker.location.zipCode(),
      }));
      await Address.insertMany(addresses);
      console.log("Addresses seeded");
    }

    // ---- CARTS ----
    if ((await Cart.countDocuments()) === 0) {
      const user = await User.findOne({ role: "user" });
      const product = await Product.findOne();
      await Cart.create({
        userId: user._id,
        items: [
          { productId: product._id, price: product.price, quantity: 2, itemSize: "40" },
        ],
      });
      console.log("Carts seeded");
    }

    // ---- FAVORITES ----
    if ((await Favorite.countDocuments()) === 0) {
      const user = await User.findOne({ role: "user" });
      const product = await Product.findOne();
      await Favorite.create({ userId: user._id, productId: product._id });
      console.log("Favorites seeded");
    }

    // ---- ORDERS ----
    if ((await Order.countDocuments()) === 0) {
      const user = await User.findOne({ role: "user" });
      const product = await Product.findOne();
      const address = await Address.findOne({ userId: user._id });
      await Order.create({
        userId: user._id,
        items: [{ product: product._id, quantity: 1, price: product.price, size: "40" }],
        total: product.price,
        shippingAddress: address._id,
        paymentMethod: "CreditCard",
      });
      console.log("Orders seeded");
    }

    console.log("Database seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seedDatabase();
