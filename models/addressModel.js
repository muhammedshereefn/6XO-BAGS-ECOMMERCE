// models/address.js

const mongoose = require("mongoose");

const addressModel = new mongoose.Schema({
  addressType: {
    type: String,
    required: true,
    enum: ["home", "work", "temp"],
  },
  houseNo: {
    type: String,
    required: true,
  },
  street: {
    type: String,
  },
  landmark: {
    type: String,
  },
  pincode: {
    type: Number,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    require: true,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  phoneNumber:{
    type:Number,
    required: true,
  }
});

const Address = mongoose.model("Address", addressModel);

module.exports = Address;
