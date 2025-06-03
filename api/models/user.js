const mongoose = require("mongoose");
const userSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      unique: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8, // mongoose will throw a validation error if the password is less than 8 characters
    },
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
      unique: true,
    },
    // status: {
    //   type: String,
    //   enum: ["active", "suspended", "banned", "pending"],
    //   required: true,
    // },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      default: null,
      required: false,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    currencyPreference: {
      type: String,
      enum: ["USD", "EUR", "GBP"], // Add your supported currencies
      default: "USD",
    },
    refreshToken: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    // the discounts that are used by the user
    usedDiscounts: [
      {
        discount: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Discount",
        },
        usedAt: Date,
      },
    ],
    // the discounts that are user specific
    eligibleDiscounts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Discount",
      },
    ],
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
