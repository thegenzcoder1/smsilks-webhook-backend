const Order = require("../models/Order");
const { fetchPaidUnfulfilledOrders } = require("../services/shopifyGraphql.service");

exports.syncPaidUnfulfilledOrders = async () => {
  try {
    console.log("🔄 Starting Shopify Sync Job...");

    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
      const data = await fetchPaidUnfulfilledOrders(cursor);

      for (const edge of data.edges) {
        const order = edge.node;

        const shopifyOrderId = order.id.split("/").pop();

        const mappedOrder = {
          shopifyOrderId,
          orderNumber: order.name,
          email: order.email,
          phone: order.phone || null,
          totalPrice: parseFloat(
            order.totalPriceSet.shopMoney.amount
          ),
          fulfillmentStatus: order.displayFulfillmentStatus,
          promoCode:
            order.discountApplications.edges[0]?.node?.code || null,
          shipmentStatus: "not delivered",
          lineItems: order.lineItems.edges.map(item => ({
            productId: item.node.product?.id?.split("/").pop() || null,
            title: item.node.title,
            quantity: item.node.quantity,
            price: parseFloat(
              item.node.originalUnitPriceSet.shopMoney.amount
            )
          })),
          status: "paid"
        };

        await Order.findOneAndUpdate(
          { shopifyOrderId },
          mappedOrder,
          { upsert: true, new: true }
        );
      }

      hasNextPage = data.pageInfo.hasNextPage;
      cursor = data.pageInfo.endCursor;
    }

    console.log("✅ Shopify Sync Completed");

  } catch (error) {
    console.error("❌ Shopify Sync Failed:", error.message);
  }
};