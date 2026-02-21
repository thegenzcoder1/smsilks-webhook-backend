const express = require("express");
const bodyParser = require("body-parser");

const shopifyRoutes = require("./routes/shopify.routes");
const shiprocketRoutes = require("./routes/shiprocket.routes");

const app = express();

app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use("/webhooks/shopify", shopifyRoutes);
app.use("/webhooks/shiprocket", shiprocketRoutes);

module.exports = app;
