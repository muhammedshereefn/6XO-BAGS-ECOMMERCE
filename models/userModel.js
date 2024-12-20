const mongoose = require("mongoose");
const Address = require("./addressModel");
const Cart = require("./cartModel");

const userModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
   },
  // password: {
  //   type: String,
  //   requird: true,
  // },
  mobile: {
    type: Number,
    required: true,
  },
  is_admin: {
    type: Number,
    default: 0,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },

  referalCode: {
    type: String,
    required: true,
  },
  addresses: [Address.schema],

  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
  },
  wallet: {
    type: Number,
    default: 0,
  },
  history: {
    type: Array,
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
    },
  },
});

module.exports = mongoose.model("User", userModel);
