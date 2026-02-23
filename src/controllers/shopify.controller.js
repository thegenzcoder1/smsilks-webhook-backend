const mongoose = require("mongoose");
const Order = require("../models/Order");
const Influencer = require("../models/Influencer");
const InfluencerInstagram = require("../models/InfluencerInstagram");
const InfluencerCredential = require("../models/InfluencerCredential");

const { fetchPromoDetails } = require("../utils/promoService");
const { generateHashedPassword } = require("../utils/passwordGenerator");
const { calculateCommission } = require("../utils/commissionCalculator");

exports.handleOrdered = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const data = req.body;

    console.log(`Data When Order Created - ${data}`);

    if (!data?.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid payload" });
    }

    const existing = await Order.findOne({ shopifyOrderId: data.id }, null, {
      session,
    });

    if (existing) {
      console.log(`Already Order Placed For Shopify Order Id: ${data.id}`);
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({ message: "Already Order Placed" });
    }

    let promoCode = data.discount_codes?.[0]?.code || null;
    let influencer = null;
    console.log(`PromoCode for which we are creating - ${promoCode}`);
    if (promoCode) {
      influencer = await Influencer.findOne({ promoCode }).session(session);

      if (!influencer) {
        const promoData = await fetchPromoDetails(promoCode);
        console.log(`Fetched PromoCode Details - ${promoData}`);
        if (promoData?.details?.length) {
          const details = promoData.details[0];

          influencer = await Influencer.create(
            [
              {
                promoCode,
                email: details.email,
                influencerInstagramUsername: details.affiliateInstagramUsername,
                allotedDiscount: details.discountPercentage,
              },
            ],
            { session },
          );

          await InfluencerInstagram.create(
            [
              {
                email: details.email,
                influencerInstagramUsername: details.affiliateInstagramUsername,
                followersCount: 0,
              },
            ],
            { session },
          );

          const hashedPassword = await generateHashedPassword();

          await InfluencerCredential.create(
            [
              {
                email: details.email,
                influencerInstagramUsername: details.affiliateInstagramUsername,
                password: hashedPassword,
              },
            ],
            { session },
          );

          influencer = influencer[0];
        }
      }
    }

    await Order.create(
      [
        {
          shopifyOrderId: data.id,
          orderNumber: data.order_number,
          email: data.email,
          phone: data.phone || null,
          totalPrice: parseFloat(data.total_price),
          fulfillmentStatus: data.fulfillment_status,
          shipmentStatus: "not delivered",
          promoCode,
          lineItems: data.line_items,
          status: "pending",
        },
      ],
      { session },
    );

    // Commit if everything succeeds
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Transaction Failed:", err);

    await session.abortTransaction();
    session.endSession();

    res.status(500).json({ error: err.message });
  }
};

exports.handleOrderPaidUpdate = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { shopifyOrderId } = req.body;

    if (!shopifyOrderId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "shopifyOrderId is required" });
    }

    // 1️⃣ Find the order
    const order = await Order.findOne(
      { shopifyOrderId },
      null,
      { session }
    );

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Order not found" });
    }

    // 2️⃣ Idempotency check
    if (order.status === "paid") {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({
        message: "Order already marked as paid"
      });
    }

    // 3️⃣ Update order status
    order.status = "paid";
    await order.save({ session });

    // 4️⃣ If promo code exists → update influencer
    if (order.promoCode) {
      const influencer = await Influencer.findOne(
        { promoCode: order.promoCode }
      ).session(session);

      if (influencer) {
        influencer.totalOrders += 1;
        influencer.totalRevenue += order.totalPrice;
        influencer.deliveredRevenue += order.totalPrice;

        // Commission calculation
        const commission =
          (order.totalPrice * influencer.allotedDiscount) / 100;

        influencer.commissionEarned += commission;

        await influencer.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Order marked as paid and influencer updated"
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Payment Update Failed:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};