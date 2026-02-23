const Order = require("../models/Order");
const Influencer = require("../models/Influencer");
const { calculateCommission } = require("../utils/commissionCalculator");
const axios = require("axios");

exports.handleOrderStatus = async (req, res) => {
  try {
    const { shipment_status, order_id } = req.body;

    const shopifyOrderId = order_id.split("_")[1];

    const order = await Order.findOne({ shopifyOrderId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.shipmentStatus = shipment_status;

    if (shipment_status === "DELIVERED") {
      order.status = "paid";

      const influencer = await Influencer.findOne({
        promoCode: order.promoCode
      });

      if (influencer) {
        influencer.deliveredRevenue += order.totalPrice;
        influencer.commissionEarned += calculateCommission(
          order.totalPrice,
          influencer.allotedDiscount
        );
        await influencer.save();
      }

      await updateShopifyOrder(shopifyOrderId);
    }

    await order.save();

    res.status(200).json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

async function updateShopifyOrder(orderId) {
  await axios.post(
    `${process.env.SHOPIFY_STORE}/admin/api/2024-01/orders/${orderId}/fulfillments.json`,
    {},
    {
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_TOKEN
      }
    }
  );
}