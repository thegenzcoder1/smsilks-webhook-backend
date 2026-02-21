const mongoose = require("mongoose");
const Order = require("../models/Order");
const Influencer = require("../models/Influencer");
const calculateCommission = require("../utils/calculateCommission");

exports.handleDeliveryUpdate = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { order_id, current_status } = req.body;

    if (!order_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "order_id is required"
      });
    }

    if (current_status !== "Delivered") {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({
        success: true,
        message: "Order not delivered yet"
      });
    }

    // Find order inside transaction
    const order = await Order.findOne(
      { shopifyOrderId: order_id },
      null,
      { session }
    );

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Prevent double processing (VERY IMPORTANT for webhooks)
    if (order.status === "delivered") {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({
        success: true,
        message: "Order already marked as delivered"
      });
    }

    // Update order
    order.status = "delivered";
    await order.save({ session });

    // Update influencer if exists
    if (order.affiliateCode) {
      const influencer = await Influencer.findOne(
        { promoCode: order.affiliateCode },
        null,
        { session }
      );

      if (influencer) {
        influencer.deliveredRevenue += order.totalPrice;
        influencer.commissionEarned += calculateCommission(order.totalPrice);

        await influencer.save({ session });
      }
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Delivery processed successfully"
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Delivery webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};