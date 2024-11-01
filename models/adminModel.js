const mongoose = require("mongoose");

const adminModel = mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  is_adimin: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Admin", adminModel);
