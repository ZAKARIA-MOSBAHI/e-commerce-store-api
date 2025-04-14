const mongoose = require("mongoose");
const orderSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        size: String, // Optional field
      },
    ],
    total: Number,
    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
    status: String,
    paymentMethod: String,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, retDoc) => {
        delete retDoc.__v;
        return retDoc;
      },
    },
  }
);
module.exports = mongoose.model("Order", orderSchema);
