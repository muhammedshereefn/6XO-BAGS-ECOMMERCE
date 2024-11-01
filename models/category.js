const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  isListed: {
    type: Boolean,
    default: true,
  },
  count: {
    type: Number, // Assuming you want to track the count for each category
    default: 0,
  },
});

module.exports = mongoose.model("Category", categorySchema);
