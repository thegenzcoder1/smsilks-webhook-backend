const Order = require("../models/Order");
const Influencer = require("../models/Influencer");
const InfluencerInstagram = require("../models/InfluencerInstagram");
const InfluencerCredential = require("../models/InfluencerCredential");

const { fetchPromoDetails } = require("../utils/promoService");
const { generatePassword } = require("../utils/passwordGenerator");

exports.handleOrdered = async (req, res) => {
  try {
    const data = req.body;

    if (!data?.id) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const existing = await Order.findOne({ shopifyOrderId: data.id });
    if (existing) return res.status(200).json({ message: "Already processed" });

    let promoCode = data.discount_codes?.[0]?.code || null;

    let influencer = null;

    if (promoCode) {
      influencer = await Influencer.findOne({ promoCode });

      if (!influencer) {
        const promoData = await fetchPromoDetails(promoCode);

        if (promoData?.details?.length) {
          const details = promoData.details[0];

          influencer = await Influencer.create({
            promoCode,
            email: details.email,
            influencerInstagramUsername: details.affiliateInstagramUsername,
            allotedDiscount: details.discountPercentage
          });

          await InfluencerInstagram.create({
            email: details.email,
            influencerInstagramUsername: details.affiliateInstagramUsername
          });

          await InfluencerCredential.create({
            email: details.email,
            influencerInstagramUsername: details.affiliateInstagramUsername,
            password: generatePassword()
          });
        }
      }
    }

    const order = await Order.create({
      shopifyOrderId: data.id,
      orderNumber: data.order_number,
      email: data.email,
      phone: data.phone,
      totalPrice: parseFloat(data.total_price),
      fulfillmentStatus: data.fulfillment_status,
      shipmentStatus: "not delivered",
      promoCode,
      lineItems: data.line_items,
      status: "pending"
    });

    if (influencer) {
      influencer.totalOrders += 1;
      influencer.totalRevenue += order.totalPrice;
      await influencer.save();
    }

    res.status(201).json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};