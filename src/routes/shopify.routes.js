const express = require("express");
const router = express.Router();
const { handleOrderPaid } = require("../controllers/shopify.controller");

router.post("/order-paid", handleOrderPaid);

module.exports = router;