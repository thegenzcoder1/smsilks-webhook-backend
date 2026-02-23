const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  shopifyOrderId: String,
  orderNumber: String,
  email: String,
  phone: String,
  totalPrice: Number,
  fulfillmentStatus: String,
  promoCode: String,
  shipmentStatus: String,
  lineItems: [
    {
      productId: String,
      title: String,
      quantity: Number,
      price: Number
    }
  ],
  status: { type: String, default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);