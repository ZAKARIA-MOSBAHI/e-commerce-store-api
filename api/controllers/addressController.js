const mongoose = require("mongoose");
const Address = require("../models/address");
const handleErrors = require("../../utils/errorHandler");
const User = require("../models/user");

// get all Addresses (admin)
module.exports.getAddresses = async (req, res) => {
  try {
    const Addresses = await Address.find().select("-__v");
    res.json(Addresses);
  } catch (e) {
    handleErrors(e, res);
  }
};
// get client Address
module.exports.getClientAddress = async (req, res) => {
  try {
    const { userId } = req.user;
    // without the need to fetch for the user
    const address = await Address.findOne({ userId }).select("-__v");
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    res.json(address);
  } catch (e) {
    handleErrors(e, res);
  }
};
// create client Address
module.exports.createClientAddress = async (req, res) => {
  try {
    const { userId } = req.user;
    const { street, city, state, country, zipCode } = req.body;
    const address = new Address({
      _id: new mongoose.Types.ObjectId(),
      userId: userId,
      street,
      city,
      state,
      country,
      zipCode,
    });
    const result = await address.save();
    const updatingUser = await User.findByIdAndUpdate(
      userId,
      {
        address: result._id,
      },
      { new: true, runValidators: true }
    );
    res.json({ newUser: updatingUser });
  } catch (e) {
    handleErrors(e, res);
  }
};
// create address (admin)
module.exports.createAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { street, city, state, country, zipCode } = req.body;
    const address = new Address({
      _id: new mongoose.Types.ObjectId(),
      userId: id,
      street,
      city,
      state,
      country,
      zipCode,
    });
    const result = await address.save();
    const updatingUser = await User.findByIdAndUpdate(
      id,
      {
        address: result._id,
      },
      { new: true, runValidators: true }
    );
    res.json({ newUser: updatingUser });
  } catch (e) {
    handleErrors(e, res);
  }
};
// delete client Address
module.exports.deleteClientAddress = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const addressId = user.address;
    if (!addressId) {
      return res.status(404).json({ message: "User has no linked address" });
    }
    const deletedAddress = await Address.findByIdAndDelete(addressId);
    if (!deletedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }
    user.address = null;
    await user.save();
    res.json({ message: "deleted successfully" });
  } catch (e) {
    handleErrors(e, res);
  }
};
// delete address (admin)
module.exports.deleteAddress = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Get the address ID from the user
    const addressId = user.address;
    if (!addressId) {
      return res.status(400).json({ message: "User has no linked address" });
    }

    // 3. Delete the address and get its data
    const deletedAddress = await Address.findByIdAndDelete(addressId);
    if (!deletedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    // 4. Clear the address reference from the user
    user.address = null;
    await user.save();

    // 5. Return the deleted address data
    return res
      .status(200)
      .json({ message: "deleted successfully", data: deletedAddress });
  } catch (error) {
    handleErrors(error, res);
  }
};
//update client address
module.exports.updateClientAddress = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId);
    const allowedFields = ["street", "city", "state", "country", "zipCode"];
    const updateData = {};

    // Populate updateData with only present and allowed fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    const addressId = user.address;
    const address = await Address.findByIdAndUpdate(addressId, updateData, {
      new: true,
      runValidators: true,
    });
    if (!address) {
      return res.status(404).json({ message: "User has no linked Address" });
    }
    return res.status(200).json({ address });
  } catch (e) {
    return handleErrors(e, res);
  }
};
//update address (admin)
module.exports.updateAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    const allowedFields = ["street", "city", "state", "country", "zipCode"];
    const updateData = {};

    // Populate updateData with only present and allowed fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    const addressId = user.address;
    const address = await Address.findByIdAndUpdate(addressId, updateData, {
      new: true,
      runValidators: true,
    });
    if (!address) {
      return res.status(404).json({ message: "User has no linked Address" });
    }
    return res.status(200).json({ address });
  } catch (e) {
    return handleErrors(e, res);
  }
};
