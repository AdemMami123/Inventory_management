const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate an invoice PDF for an order
 * @param {Object} order - The order object
 * @param {Object} options - Options for the PDF generation
 * @returns {Promise<Buffer>} - A promise that resolves to the PDF buffer
 */
const generateInvoicePDF = (order, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Invoice #${order._id}`,
          Author: 'Inventory Management System',
        }
      });

      // Buffer to store PDF
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Add company logo if available
      const logoPath = path.join(__dirname, '../public/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 150 });
      } else {
        // If no logo, just add company name as text
        doc.fontSize(20).text('Inventory Management System', 50, 45);
      }

      // Add invoice title
      doc.fontSize(20)
        .text('INVOICE', 50, 50, { align: 'right' });

      // Add invoice number and date
      doc.fontSize(10)
        .text(`Invoice Number: ${order._id}`, 50, 90, { align: 'right' })
        .text(`Date: ${new Date(order.updatedAt).toLocaleDateString()}`, 50, 105, { align: 'right' })
        .moveDown();

      // Add a horizontal line
      doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, 120)
        .lineTo(550, 120)
        .stroke()
        .moveDown();

      // Add company and customer information
      doc.fontSize(12)
        .text('From:', 50, 140)
        .fontSize(10)
        .text('Inventory Management System', 50, 155)
        .text('123 Business Street', 50, 170)
        .text('Business City, 12345', 50, 185)
        .text('Email: contact@example.com', 50, 200)
        .text('Phone: (123) 456-7890', 50, 215)
        .moveDown();

      // Customer information
      doc.fontSize(12)
        .text('Bill To:', 300, 140)
        .fontSize(10);

      // Check if customer info exists and use appropriate fields
      if (order.customer) {
        doc.text(order.customer.name || 'N/A', 300, 155)
          .text(order.customer.email || 'N/A', 300, 170);
      } else if (order.customerInfo) {
        doc.text(order.customerInfo.name || 'N/A', 300, 155)
          .text(order.customerInfo.email || 'N/A', 300, 170);
        
        if (order.customerInfo.phone) {
          doc.text(`Phone: ${order.customerInfo.phone}`, 300, 185);
        }
        
        if (order.customerInfo.address) {
          doc.text(`Address: ${order.customerInfo.address}`, 300, 200);
        }
      } else {
        doc.text('Customer information not available', 300, 155);
      }

      // Add a horizontal line
      doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, 240)
        .lineTo(550, 240)
        .stroke()
        .moveDown();

      // Add table headers
      const tableTop = 270;
      doc.fontSize(10)
        .text('Item', 50, tableTop)
        .text('Quantity', 280, tableTop, { width: 90, align: 'center' })
        .text('Unit Price', 370, tableTop, { width: 90, align: 'right' })
        .text('Amount', 470, tableTop, { width: 80, align: 'right' });

      // Add a horizontal line
      doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Add table rows
      let y = tableTop + 25;
      let totalAmount = 0;

      // Check if products exist and iterate through them
      if (order.products && Array.isArray(order.products)) {
        order.products.forEach((item, i) => {
          const product = item.product || {};
          const productName = item.name || product.name || 'Unknown Product';
          const quantity = item.quantity || 0;
          const price = item.price || product.price || 0;
          const amount = quantity * price;
          totalAmount += amount;

          doc.fontSize(10)
            .text(productName, 50, y, { width: 230 })
            .text(quantity.toString(), 280, y, { width: 90, align: 'center' })
            .text(`$${price.toFixed(2)}`, 370, y, { width: 90, align: 'right' })
            .text(`$${amount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });

          y += 20;

          // Add a dotted line between items
          if (i < order.products.length - 1) {
            doc.strokeColor('#dddddd')
              .lineWidth(1)
              .moveTo(50, y - 5)
              .lineTo(550, y - 5)
              .stroke();
          }
        });
      } else {
        doc.fontSize(10)
          .text('No products found in this order', 50, y);
        y += 20;
      }

      // Add a horizontal line
      doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, y + 10)
        .lineTo(550, y + 10)
        .stroke();

      // Add total
      y += 30;
      doc.fontSize(12)
        .text('Total:', 400, y, { width: 70, align: 'right' })
        .text(`$${(order.totalAmount || totalAmount).toFixed(2)}`, 470, y, { width: 80, align: 'right' });

      // Add payment information
      y += 40;
      doc.fontSize(10)
        .text('Payment Information', 50, y)
        .moveDown(0.5);
      
      doc.fontSize(9)
        .text(`Payment Status: ${order.paymentStatus || 'Unknown'}`, 50, y + 15)
        .text(`Payment Method: ${order.paymentMethod || 'Unknown'}`, 50, y + 30);

      // Add order status and tracking information if available
      y += 60;
      doc.fontSize(10)
        .text('Order Information', 50, y)
        .moveDown(0.5);
      
      doc.fontSize(9)
        .text(`Order Status: ${order.status || 'Unknown'}`, 50, y + 15);
      
      if (order.trackingNumber) {
        doc.text(`Tracking Number: ${order.trackingNumber}`, 50, y + 30);
      }

      // Add notes if available
      if (order.notes) {
        y += 60;
        doc.fontSize(10)
          .text('Notes', 50, y)
          .moveDown(0.5);
        
        doc.fontSize(9)
          .text(order.notes, 50, y + 15, { width: 500 });
      }

      // Add footer
      const footerTop = doc.page.height - 50;
      doc.fontSize(10)
        .text('Thank you for your business!', 50, footerTop, { align: 'center', width: 500 })
        .moveDown(0.5)
        .fontSize(8)
        .text('This is a computer-generated invoice and does not require a signature.', 50, footerTop + 15, { align: 'center', width: 500 });

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF };
