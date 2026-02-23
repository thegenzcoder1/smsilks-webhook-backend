const mongoose = require("mongoose");

const InfluencerCredentialSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  influencerInstagramUsername: { type: String, unique: true },
  password: String,
  sessionToken: String,
  sessionTokenExpiryTime: Date
});

module.exports = mongoose.model("InfluencerCredential", InfluencerCredentialSchema);