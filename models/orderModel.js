const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    address: {
      type:Object,
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        price: {
          type: Number,
        },
        total: {
          type: Number,
        },
      },
    ],
    paymentMethod: {
      type: String,
      required: true,
      enum: ["razorpay", "wallet", "cod"],
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Out for Delivery",
        "Confirmed",
        "Refunded"
      ],
      default: "Pending",
    },
    grandTotal: Number,
    discountedTotal: Number, // New field to store the discounted total
    cancelRequest: {
      type: Boolean,
      default: false,
    },
    reason: String,
    response: Boolean,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    cancellationStatus: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
