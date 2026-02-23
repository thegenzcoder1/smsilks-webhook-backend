const mongoose = require("mongoose");

const InfluencerInstagramSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  influencerInstagramUsername: { type: String, unique: true },
  followersCount: { type: Number, default: 0 }
});

module.exports = mongoose.model("InfluencerInstagram", InfluencerInstagramSchema);