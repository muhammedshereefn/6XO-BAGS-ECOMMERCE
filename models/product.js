const mongoose = require("mongoose");

const productModel = new mongoose.Schema(
  {
    images: [
      {
        type: String,
      },
    ],

    coverimage: {
      type: String,
    },
    name: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    category: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
    },  
    isFeature: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      default: 1,
    },
    offerPrice: {
      type: Number,
    },
    block: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productModel);

module.exports = { Product };
