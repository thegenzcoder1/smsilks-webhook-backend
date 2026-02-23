const express = require("express");
const router = express.Router();
const { handleOrderPaid } = require("../controllers/shopify.controller");

router.post("/ordered", handleOrderPaid);

module.exports = router;