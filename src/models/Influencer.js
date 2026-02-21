const mongoose = require("mongoose");

const influencerSchema = new mongoose.Schema({
  promoCode: { type: String, unique: true },  
  email: String,
  influencerInstagramUsername: String,
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  deliveredRevenue: { type: Number, default: 0 },
  commissionEarned: { type: Number, default: 0 }
});

module.exports = mongoose.model("Influencer", influencerSchema);