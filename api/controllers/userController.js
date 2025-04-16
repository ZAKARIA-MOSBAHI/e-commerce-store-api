const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const handleErrors = require("../../utils/errorHandler");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/utils");

module.exports.signup = async (req, res) => {
  // next add confirm password field
  try {
    const { email, password, name, address, phone, currencyPreference } =
      req.body;

    if (password.trim().length < 8) {
      return res.status(400).json({
        field: "password",
        message: "Password must be at least 8 characters",
      });
    }

    // Using await with bcrypt.hash to stay in the try/catch scope
    const hash = await bcrypt.hash(password, 12);
    const userId = new mongoose.Types.ObjectId();

    const userToAdd = new User({
      _id: userId,
      email,
      password: hash,
      name,
      phone,
      currencyPreference,
      role: "user",
    });

    const result = await userToAdd.save();
    return res
      .status(201)
      .json({ message: "User created successfully", user: result });
  } catch (error) {
    return handleErrors(error, res);
  }
};
// login,  you can add 2 factor auth middleware for admin when logged in
module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        field: "LoginFailedError",
        message: "Email or password is incorrect",
      });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        field: "LoginFailedError",
        message: "Email or password is incorrect",
      });
    }
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);
    user.refreshToken = refreshToken;
    user.lastLogin = Date.now();
    await user.save();
    const updatedUser = await User.findById(user._id)
      .populate("address")
      .select("-password -refreshToken -__v -lastLogin -createdAt -updatedAt");

    return res.status(200).json({
      success: true,

      user: updatedUser,
      message: "User logged in successfully",
      accessToken,
      refreshToken,
    });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// get users (admin)
module.exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, { __v: 0 })
      .select("-password")
      .populate("address");
    return res.status(200).json({ users });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// get user by id (admin)
module.exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select("-password -__v")
      .populate("address");
    return res.status(200).json({ user });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// get the logging user account
module.exports.getClientUser = async (req, res) => {
  try {
    console.log("user", req.user);
    const { userId } = req.user; // this is passed by the auth middleware
    const user = await User.findById(userId)
      .select("-password -role")
      .populate("address");
    return res.status(200).json({ user });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// delete the logging user accoutn
module.exports.deleteClientUser = async (req, res) => {
  const { userId } = req.user;
  try {
    const response = await User.findByIdAndDelete(userId);
    return res
      .status(200)
      .json({ message: "User deleted successfully", response });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// delete a user (admin)
module.exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const response = await User.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ message: "User deleted successfully", response });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// Update the logged-in user account (client)
module.exports.updateClientUser = async (req, res) => {
  try {
    const { userId } = req.user;
    // Define allowed fields for client updates (exclude 'role')
    const allowedFields = [
      "name",
      "email",
      "password",
      "phone",
      "currencyPreference",
    ];
    const updateData = {};

    // Populate updateData with only present and allowed fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Optionally handle password hashing here if necessary
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json({ user });
  } catch (e) {
    return handleErrors(e, res);
  }
};

// Update a user (admin)
module.exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Define allowed fields for admin updates (include 'role')
    const allowedFields = [
      "name",
      "email",
      "password",
      "role",
      "phone",
      "currencyPreference",
    ];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle password hashing for admin updates as well
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json({ user });
  } catch (e) {
    return handleErrors(e, res);
  }
};
