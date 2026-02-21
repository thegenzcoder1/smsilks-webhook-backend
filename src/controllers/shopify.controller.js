const Order = require("../models/Order");

exports.handleOrderPaid = async (req, res) => {
  try {
    const data = req.body;

    // Basic validation
    if (!data?.id) {
      return res.status(400).json({
        success: false,
        message: "Invalid Shopify payload: missing order id"
      });
    }

    // Idempotency check (VERY IMPORTANT)
    const existingOrder = await Order.findOne({
      shopifyOrderId: data.id
    });

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: "Order already processed"
      });
    }

    // Extract Affiliate Code (priority: discount_codes -> note_attributes)
    let affiliateCode = null;

    if (data.discount_codes && data.discount_codes.length > 0) {
      affiliateCode = data.discount_codes[0].code;
    }

    if (!affiliateCode && data.note_attributes) {
      const affiliateAttr = data.note_attributes.find(
        attr => attr.name === "Affiliate Ref"
      );
      if (affiliateAttr) {
        affiliateCode = affiliateAttr.value;
      }
    }

    // Extract line items cleanly
    const lineItems = (data.line_items || []).map(item => ({
      productId: item.product_id?.toString() || null,
      title: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price)
    }));

    // Create Order document
    const newOrder = await Order.create({
      shopifyOrderId: data.id.toString(),
      orderNumber: data.order_number?.toString(),
      email: data.email || null,
      phone: data.phone || null,
      totalPrice: parseFloat(data.total_price),
      financialStatus: data.financial_status,
      fulfillmentStatus: data.fulfillment_status,
      affiliateCode,
      lineItems,
      status: "pending" // Will change to delivered later
    });

    return res.status(201).json({
      success: true,
      message: "Order stored successfully",
      orderId: newOrder._id
    });

  } catch (error) {
    console.error("Order webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};