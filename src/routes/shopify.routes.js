const express = require("express");
const router = express.Router();
const { handleOrdered } = require("../controllers/shopify.controller");

router.post("/ordered", handleOrdered);

module.exports = router;