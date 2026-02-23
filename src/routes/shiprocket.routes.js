const express = require("express");
const router = express.Router();
const { handleOrderStatus } = require("../controllers/shiprocket.controller");

router.post("/orderstatus", handleOrderStatus);

module.exports = router;