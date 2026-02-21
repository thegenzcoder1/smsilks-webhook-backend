const Order = require("../models/Order");
const Influencer = require("../models/Influencer");
const verifyShopifyHmac = require("../utils/verifyShopifyHmac");
const calculateCommission = require("../utils/calculateCommission");

exports.handleOrderPaid = async (req, res) => {

  console.log(req);
  if (!verifyShopifyHmac(req)) {
    return res.status(401).send("Unauthorized");
  }

  
  const data = req.body;

  /* 
  const affiliateCode = data.discount_codes?.[0]?.code || null;
  const newOrder = await Order.create({
    shopifyOrderId: data.id,
    orderNumber: data.order_number,
    email: data.email,
    phone: data.phone,
    totalPrice: parseFloat(data.total_price),
    financialStatus: data.financial_status,
    fulfillmentStatus: data.fulfillment_status,
    affiliateCode,
    lineItems: data.line_items.map(item => ({
      productId: item.product_id,
      title: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price)
    }))
  });
  if (affiliateCode) {
    const influencer = await Influencer.findOne({ code: affiliateCode });
    if (influencer) {
        influencer.totalOrders += 1;
        influencer.totalRevenue += newOrder.totalPrice;
        await influencer.save();
    }
}

*/
res.status(200).send("Order processed");
};