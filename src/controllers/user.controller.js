const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const handleErrors = require("../utils/errorHandler");
const { generateAccessToken, generateRefreshToken } = require("../utils/utils");
const { MOROCCAN_PHONE_REGEX, ZIPCODE_REGEX } = require("../config/constants");
const Address = require("../models/address");
const Notification = require("../models/notification");

module.exports.signup = async (req, res) => {
  // next add confirm password field
  try {
    const { name, email, password } = req.body;

    // Check if the user already exists
    const existingUserName = await User.findOne({ name });
    if (existingUserName) {
      return res.status(400).json({
        success: false,
        field: "name",
        message: "Name already exists",
      });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        field: "email",
        message: "Email already exists",
      });
    }
    if (password.trim().length < 8) {
      return res.status(400).json({
        success: false,
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
      phone: null,
    });

    const result = await userToAdd.save();
    const userAccessToken = generateAccessToken(userId, result.role);
    const userRefreshToken = generateRefreshToken(userId, result.role);
    const userResponse = {
      accessToken: userAccessToken,
      _id: result._id,
      name: result.name,
      email: result.email,
      phone: result.phone,
      addressId: result.addressId,
      lastLogin: result.lastLogin,
      role: result.role,
      status: result.status,
      currencyPreference: result.currencyPreference,
      usedDiscounts: result.usedDiscounts,
      eligibleDiscounts: result.eligibleDiscounts,
      refreshToken: userRefreshToken,
    };
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: userResponse,
    });
  } catch (error) {
    return handleErrors(error, res);
  }
};
// login,  you can add 2 factor auth middleware for admin when logged in
module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }); // it doesn't find the user even if exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email or password is incorrect",
      });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Email or password is incorrect",
      });
    }
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);
    user.refreshToken = refreshToken;
    user.lastLogin = Date.now();
    await user.save();
    const updatedUser = await User.findById(user._id).select(
      "-password -refreshToken -__v -lastLogin -createdAt -updatedAt",
    );
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
    const users = await User.aggregate([
      {
        $lookup: {
          from: "addresses",
          localField: "addressId",
          foreignField: "_id",
          as: "addressId",
          pipeline: [
            {
              $project: {
                userId: 0,
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
              },
            },
          ],
        },
      },

      {
        $unwind: {
          path: "$addressId",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "userId",
          as: "orders",
        },
      },

      {
        $addFields: {
          orderCount: { $size: "$orders" },
        },
      },

      {
        $project: {
          password: 0,
          refreshToken: 0,
          updatedAt: 0,
          createdAt: 0,
          __v: 0,
          orders: 0, // remove orders array, keep only count
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      users,
    });
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
      .select("-password  -__v  -createdAt -updatedAt")
      .populate("addressId");
    return res.status(200).json({ success: true, user });
  } catch (e) {
    return handleErrors(e, res);
  }
};
// delete the logging user account
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
  const adminId = req.user.userId;

  const session = await mongoose.startSession();

  try {
    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    session.startTransaction();

    // 2. Check if user exists
    const user = await User.findById(id).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3. Prevent deleting admin accounts
    if (user.role === "admin") {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be deleted",
      });
    }

    // 4. Delete associated addresses
    await Address.deleteMany({ userId: id }).session(session);

    // 5. Delete user
    await User.findByIdAndDelete(id).session(session);

    // 6. Create notification ONLY after successful deletion
    await Notification.create(
      [
        {
          type: "ACCOUNT_DELETED",
          message: `User account ${user.email} has been deleted by admin.`,
          sender: adminId,
          metadata: {
            userId: id,
          },
        },
      ],
      { session },
    );

    // 7. Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "User and associated addresses deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Update the logged-in user account (client)
module.exports.updateClientUser = async (req, res) => {
  try {
    const { userId } = req.user;
    // Define allowed fields for client updates (exclude 'role')
    const allowedFields = ["name", "email", "password", "phone"];
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

module.exports.createUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const adminId = req.user.userId;
  console.log(req.body);
  try {
    const fields = [
      "name",
      "email",
      "password",
      "role",
      "phone",
      "street",
      "city",
      "zipCode",
    ];

    // 1️⃣ Check for missing fields
    for (const field of fields) {
      const value = req.body[field];
      if (!value) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Missing field ${field}`,
        });
      }
    }

    let { name, email, password, role, phone, street, city, zipCode } =
      req.body;

    name = name.trim();
    email = email.trim();
    street = street.trim();
    city = city.trim();
    phone = phone.trim();
    zipCode = zipCode.trim();

    // 2️⃣ Validate role
    if (!["user", "admin"].includes(role)) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Invalid role value" });
    }

    // 3️⃣ Validate phone
    if (!MOROCCAN_PHONE_REGEX.test(phone)) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Invalid phone value" });
    }

    // 4️⃣ Validate zipCode
    if (!ZIPCODE_REGEX.test(zipCode)) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Invalid zip code value" });
    }

    // 5️⃣ Validate street and city length
    if (street.length < 10 || city.length < 3) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message:
          "Street must be at least 10 characters and City at least 5 characters",
      });
    }

    // 6️⃣ Check existing username
    const existingUserName = await User.findOne({ name }).session(session);
    if (existingUserName) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Username already exists" });
    }

    // 7️⃣ Check existing email
    const existingEmail = await User.findOne({ email }).session(session);
    if (existingEmail) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    // 8️⃣ Validate password length
    if (password.trim().length < 8) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // 9️⃣ Hash password
    const hash = await bcrypt.hash(password, 12);
    const userId = new mongoose.Types.ObjectId();
    const addressId = new mongoose.Types.ObjectId();

    // 10️⃣ Create address
    const userAddress = new Address({
      _id: addressId,
      userId,
      street,
      city,
      zipCode,
    });

    await userAddress.save({ session });

    // 11️⃣ Create user
    const user = new User({
      _id: userId,
      name,
      email,
      password: hash,
      phone,
      role,
      addressId,
      usedDiscounts: [],
      eligibleDiscounts: [],
    });

    await user.save({ session });

    // 12️⃣ Create a notification for all admins
    await Notification.create(
      [
        {
          type: "USER_CREATED",
          message: `New user account created: ${name} by admin.`,
          sender: adminId,
          metadata: {
            userId,
          },
        },
      ],
      { session },
    );

    // 13️⃣ Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 14️⃣ Prepare response
    const populatedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      orderCount: 0,
      usedDiscounts: user.usedDiscounts,
      eligibleDiscounts: user.eligibleDiscounts,
      lastLogin: user.lastLogin,
      refreshToken: user.refreshToken,
      currencyPreference: user.currencyPreference,
      addressId: {
        _id: userAddress._id,
        country: userAddress.country,
        city: userAddress.city,
        zipCode: userAddress.zipCode,
        street: userAddress.street,
        userId: userAddress.userId,
      },
    };

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      newUser: populatedUser,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

module.exports.suspendUser = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.userId;

  const session = await mongoose.startSession();

  try {
    // 1. Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    session.startTransaction();

    // 2. Check if user exists
    const user = await User.findById(id).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3. Prevent suspending admins
    if (user.role === "admin") {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be suspended",
      });
    }

    // 4. Prevent duplicate suspension
    if (user.status === "suspended") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "User is already suspended",
      });
    }

    // 5. Suspend user
    user.status = "suspended";
    await user.save({ session });

    // 6. Create notification
    await Notification.create(
      [
        {
          type: "ACCOUNT_SUSPENDED",
          message: `User account ${user.email} has been suspended by admin.`,
          sender: adminId,
          metadata: {
            userId: id,
          },
        },
      ],
      { session },
    );

    // 7. Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "User suspended successfully",
      user: {
        _id: user._id,
        status: user.status,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
