const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const handleErrors = require("../../utils/errorHandler");

module.exports.signup = async (req, res) => {
  // next add confirm password field
  try {
    const { email, password, role } = req.body;

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
      role,
    });

    const result = await userToAdd.save();
    return res
      .status(201)
      .json({ message: "User created successfully", user: result });
  } catch (error) {
    return handleErrors(error, res);
  }
};
// login
module.exports.login = async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Authentication Failed",
      });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      "JWT_SECRET",
      {
        expiresIn: "1h",
      }
    );
    return res.status(200).json({
      message: "User logged in successfully",
      token,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// get users (admin)
module.exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, { __v: 0 }).select("-password");
    return res.status(200).json({ users });
  } catch (e) {
    return handleErrors(e, res);
  }
};
module.exports.getClientUser = async (req, res) => {
  try {
    const { userId } = req.user; // this is passed by the auth middleware
    const user = await User.findById(userId).select("-password -role");
    return res.status(200).json({ user });
  } catch (e) {
    return handleErrors(e, res);
  }
};
