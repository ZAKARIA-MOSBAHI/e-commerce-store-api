const mongoose = require("mongoose");
const userSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    // name: {
    //   type: String,
    //   required: [true, "Name is required"],
    //   trim: true,
    // },

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
    // phone: {
    //   type: String,
    //   validate: {
    //     validator: function (v) {
    //       return /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(v);
    //     },
    //     message: (props) => `${props.value} is not a valid phone number!`,
    //   },
    // },
    // //   address: {
    // //      type: mongoose.Schema.Types.ObjectId,
    // //         ref: "Adress",
    // //   },
    // role: {
    //   type: String,
    //   enum: ["admin", "user"],
    //   default: "user",
    // },
    // currencyPreference: {
    //   type: String,
    //   enum: ["USD", "EUR", "GBP"], // Add your supported currencies
    //   default: "USD",
    // },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
