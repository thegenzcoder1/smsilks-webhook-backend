exports.syncPaidOrders = async () => {
  try {
    console.log("🔄 Starting Shopify Full Sync Job...");

    let hasNextPage = true;
    let cursor = null;

    while (hasNextPage) {
      const data = await fetchPaidOrders(cursor); 
      // 🔥 IMPORTANT: remove fulfillment filter in service

      for (const edge of data.edges) {
        const order = edge.node;
        const shopifyOrderId = order.id.split("/").pop();

        const fulfillmentStatusRaw =
          order.displayFulfillmentStatus || "";

        const normalizedFulfillment =
          fulfillmentStatusRaw.toUpperCase();

        const mappedOrder = {
          shopifyOrderId,
          orderNumber: order.name,
          email: order.email,
          phone: order.phone || null,
          totalPrice: parseFloat(
            order.totalPriceSet.shopMoney.amount
          ),
          fulfillmentStatus: fulfillmentStatusRaw,
          promoCode:
            order.discountApplications.edges[0]?.node?.code || null,
          shipmentStatus:
            normalizedFulfillment === "FULFILLED"
              ? "FULFILLED"
              : "NOT FULFILLED",
          lineItems: order.lineItems.edges.map(item => ({
            productId:
              item.node.product?.id?.split("/").pop() || null,
            title: item.node.title,
            quantity: item.node.quantity,
            price: parseFloat(
              item.node.originalUnitPriceSet.shopMoney.amount
            )
          })),
          status: "paid"
        };

        const existingOrder = await Order.findOne({ shopifyOrderId });

        if (!existingOrder) {
          await Order.create(mappedOrder);
          console.log(`🆕 Created Order: ${shopifyOrderId}`);
        } else {
          let needsUpdate = false;

          if (
            existingOrder.fulfillmentStatus !==
            mappedOrder.fulfillmentStatus
          ) {
            existingOrder.fulfillmentStatus =
              mappedOrder.fulfillmentStatus;
            existingOrder.shipmentStatus =
              mappedOrder.shipmentStatus;
            needsUpdate = true;
          }

          if (existingOrder.totalPrice !== mappedOrder.totalPrice) {
            existingOrder.totalPrice =
              mappedOrder.totalPrice;
            needsUpdate = true;
          }

          if (existingOrder.status !== "paid") {
            existingOrder.status = "paid";
            needsUpdate = true;
          }

          if (needsUpdate) {
            await existingOrder.save();
            console.log(`🔄 Updated Order: ${shopifyOrderId}`);
          }
        }
      }

      hasNextPage = data.pageInfo.hasNextPage;
      cursor = data.pageInfo.endCursor;
    }

    console.log("✅ Shopify Full Sync Completed");

  } catch (error) {
    console.error("❌ Shopify Sync Failed:", error.message);
  }
};