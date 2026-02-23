const axios = require("axios");

exports.fetchPromoDetails = async (promoCode) => {
  const res = await axios.get(
    `https://api.kancheepuramsmsilks.net/api/promoCode/search/${promoCode}`,
    {
      headers: {
        token: process.env.PROMO_TOKEN
      }
    }
  );
  return res.data[0];
};