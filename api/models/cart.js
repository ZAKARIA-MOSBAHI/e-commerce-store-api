const mongoose = require("mongoose");
const cartSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          min: 1,
          default: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true, // this will make sure to include the virtual total field we made
      transform: (document, returnedDoc) => {
        // remove the properties _id and __v from the returned document
        delete returnedDoc._id;
        delete returnedDoc.__v;
        return returnedDoc;
      },
    },
  }
);
cartSchema.virtual("total").get(function () {
  // since we can't store the total because it's constantly changing
  // this method will calculate it on every request and add it as a property to the document
  return this.items.reduce((sum, item) => {
    return sum + item.quantity * item.product.price;
  }, 0);
});
const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
