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
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        quantity: Number,
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
