const cron = require("node-cron");
const { syncPaidUnfulfilledOrders } = require("../controllers/shopify.graphql.controller");

exports.startShopifySyncJob = () => {
  cron.schedule("0 */6 * * *", async () => {
    console.log("⏰ Running 6-hour Shopify Sync Job");
    await syncPaidUnfulfilledOrders();
  });

  console.log("📅 Shopify Sync Cron Initialized (Every 6 Hours)");
};