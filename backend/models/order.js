const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Updated to reference User instead of Customer
        required: true,
      },
      products: [
        {
          product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
          quantity: { type: Number, required: true },
        },
      ],
      totalAmount: { type: Number, required: true },
      status: {
        type: String,
        enum: ["Pending", "Shipped", "Delivered"],
        default: "Pending",
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // employee, admin, or customer who created it
      },
      createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Order", orderSchema);