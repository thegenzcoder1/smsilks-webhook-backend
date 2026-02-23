const express = require("express");
const router = express.Router();
const { handleOrdered, handleOrderPaidUpdate } = require("../controllers/shopify.controller");

router.post("/ordered", handleOrdered);
router.post("/order-paid", handleOrderPaidUpdate);

module.exports = router;