const express = require("express");
const router = express.Router();
const { handleDeliveryUpdate } = require("../controllers/shiprocket.controller");

router.post("/orderstatus", handleDeliveryUpdate);

module.exports = router;