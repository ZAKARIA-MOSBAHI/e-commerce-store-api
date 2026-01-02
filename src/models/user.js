const mongoose = require("mongoose");
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
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
      // select: false,  Will never be returned in queries unless explicitly requested
    },
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          if (v) {
            return /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(v);
          }
          return true;
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
      default: null,
      //using a partial index that checks only the non null values
      // meaning the null values will not considered unique
      index: {
        unique: true,
        partialFilterExpression: { phone: { $type: "string" } },
      },
    },
    status: {
      type: String,
      enum: ["active", "suspended", "inactive"],
      default: "active",
    },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      default: null,
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
        discountId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Discount",
        },
        usedAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
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
