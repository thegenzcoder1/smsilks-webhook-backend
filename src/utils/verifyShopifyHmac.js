const crypto = require("crypto");

module.exports = function verifyShopifyHmac(req) {
  const hmac = req.get("X-Shopify-Hmac-Sha256");
  const digest = crypto
    .createHmac("sha256", process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(req.rawBody, "utf8")
    .digest("base64");

  return digest === hmac;
};