const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const handleErrors = require("../../utils/errorHandler");

module.exports.createUser = async (req, res) => {
  // next add confirm password field
  try {
    const { email, password } = req.body;

    if (password.trim().length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // Using await with bcrypt.hash to stay in the try/catch scope
    const hash = await bcrypt.hash(password, 10);

    const userToAdd = new User({
      _id: new mongoose.Types.ObjectId(),
      email,
      password: hash,
    });

    const result = await userToAdd.save();
    return res
      .status(201)
      .json({ message: "User created successfully", user: result });
  } catch (error) {
    return handleErrors(error, res);
  }
};
