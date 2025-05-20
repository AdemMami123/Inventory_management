const sendEmail = require('./sendEmail');
const User = require('../models/user');
const { generateInvoicePDF } = require('./invoiceGenerator');

/**
 * Send an email notification about an order status change
 * @param {Object} order - The order object
 * @param {String} previousStatus - The previous status of the order
 * @param {String} newStatus - The new status of the order
 * @param {Object} user - The user who made the change (admin/manager)
 * @param {Boolean} attachInvoice - Whether to attach an invoice PDF (for delivered orders)
 */
const sendOrderStatusNotification = async (order, previousStatus, newStatus, user, attachInvoice = false) => {
  try {
    // Get the customer's email
    let customerEmail = order.customerInfo?.email;

    // If no email in customerInfo, try to get it from the customer reference
    if (!customerEmail && order.customer) {
      const customerUser = await User.findById(order.customer);
      if (customerUser) {
        customerEmail = customerUser.email;
      }
    }

    if (!customerEmail) {
      console.error('Could not find customer email for order notification', order._id);
      return;
    }

    // Create the email subject
    const subject = `Order Status Update: ${order._id}`;

    // Create the email message based on the new status
    let message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Status Update</h2>
        <p>Hello ${order.customerInfo?.name || 'Valued Customer'},</p>
        <p>Your order status has been updated.</p>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Previous Status:</strong> ${previousStatus}</p>
          <p><strong>New Status:</strong> <span style="color: ${getStatusColor(newStatus)}; font-weight: bold;">${newStatus}</span></p>
    `;

    // Add status-specific information
    switch (newStatus) {
      case 'Approved':
        message += `
          <p>Your order has been approved and is being prepared for shipping.</p>
        `;
        break;
      case 'Shipped':
        message += `
          <p>Your order is on its way!</p>
          ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
          ${order.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toDateString()}</p>` : ''}
        `;
        break;
      case 'Delivered':
        message += `
          <p>Your order has been delivered successfully. We hope you enjoy your purchase!</p>
          <p>If you have any issues with your order, please contact our customer support.</p>
        `;
        break;
      case 'Cancelled':
        message += `
          <p>Your order has been cancelled.</p>
          ${order.notes ? `<p><strong>Reason:</strong> ${order.notes}</p>` : ''}
          <p>If you have any questions about this cancellation, please contact our customer support.</p>
        `;
        break;
      default:
        message += `
          <p>Thank you for your order. We'll keep you updated on its progress.</p>
        `;
    }

    // Add order summary
    message += `
        </div>

        <h3 style="color: #333; margin-top: 30px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Quantity</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Add product rows
    order.products.forEach(item => {
      const productName = item.name || (item.product && item.product.name) || 'Product';
      message += `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${productName}</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${item.quantity}</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `;
    });

    // Add total
    message += `
          </tbody>
          <tfoot>
            <tr style="background-color: #f5f5f5;">
              <td colspan="2" style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>Total:</strong></td>
              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;"><strong>$${order.totalAmount.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>

        <p style="margin-top: 30px;">Thank you for shopping with us!</p>
        <p>If you have any questions, please contact our customer support.</p>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `;

    // Prepare attachments if needed
    let attachments = [];

    // For delivered orders, generate and attach invoice if requested
    if (newStatus === 'Delivered' && attachInvoice) {
      try {
        console.log(`Generating invoice PDF for order ${order._id}`);
        const pdfBuffer = await generateInvoicePDF(order);

        attachments.push({
          filename: `Invoice-${order._id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        });

        console.log(`Invoice PDF generated and attached for order ${order._id}`);
      } catch (invoiceError) {
        console.error('Error generating invoice PDF:', invoiceError);
        // Continue with email sending even if invoice generation fails
      }
    }

    // Send the email with attachments if any
    await sendEmail(
      subject,
      message,
      customerEmail,
      process.env.EMAIL_USER || 'noreply@inventorymanager.com',
      process.env.EMAIL_USER || 'noreply@inventorymanager.com',
      attachments
    );

    console.log(`Order status notification sent to ${customerEmail} for order ${order._id}`);

  } catch (error) {
    console.error('Error sending order status notification:', error);
  }
};

/**
 * Get the color for a specific order status
 * @param {String} status - The order status
 * @returns {String} - The color code for the status
 */
const getStatusColor = (status) => {
  switch (status) {
    case 'Pending':
      return '#f59e0b'; // Yellow
    case 'Approved':
      return '#3b82f6'; // Blue
    case 'Shipped':
      return '#8b5cf6'; // Purple
    case 'Delivered':
      return '#10b981'; // Green
    case 'Cancelled':
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
};

module.exports = {
  sendOrderStatusNotification
};
