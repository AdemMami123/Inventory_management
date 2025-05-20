const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const { generateInvoicePDF } = require("../utils/invoiceGenerator");

/**
 * Generate and download an invoice for an order
 * @route GET /api/orders/:id/invoice
 * @access Private (Customer, Admin, Manager)
 */
const generateInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the order
  const order = await Order.findById(id)
    .populate("customer", "name email")
    .populate("products.product", "name price");

  // Check if order exists
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Check if user has permission to access this order
  // Customers can only access their own orders
  if (
    req.user.role === "customer" &&
    (!order.customer || order.customer._id.toString() !== req.user.id)
  ) {
    res.status(403);
    throw new Error("You don't have permission to access this order");
  }

  // Check if order is in a state where an invoice can be generated
  // Only generate invoices for delivered orders
  if (order.status !== "Delivered") {
    res.status(400);
    throw new Error("Invoice can only be generated for delivered orders");
  }

  try {
    // Generate the PDF
    const pdfBuffer = await generateInvoicePDF(order);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice-${order._id}.pdf`
    );
    
    // Send the PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500);
    throw new Error("Failed to generate invoice");
  }
});

module.exports = {
  generateInvoice,
};
