const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const mongoose = require("mongoose");
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const { generateInvoicePDF } = require("../utils/invoiceGenerator");

/**
 * Get sales reports with filtering options
 * @route GET /api/reports/sales
 * @access Private (Admin, Manager)
 */
const getSalesReport = asyncHandler(async (req, res) => {
  try {
    // Extract query parameters
    const {
      startDate,
      endDate,
      period = 'daily', // daily, weekly, monthly, yearly
      category,
      limit = 100
    } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate) };
    }

    // Build category filter (for product-specific sales)
    const categoryFilter = category && category !== 'all' ? { "products.product.category": category } : {};

    // Combine filters
    const filter = {
      ...dateFilter,
      ...categoryFilter,
      status: { $ne: "Cancelled" } // Exclude cancelled orders
    };

    // Define grouping based on period
    let groupBy;
    let sortBy;

    switch (period) {
      case 'yearly':
        groupBy = {
          _id: { year: { $year: "$createdAt" } },
          label: { $first: { $toString: "$_id.year" } }
        };
        sortBy = { "_id.year": 1 };
        break;
      case 'monthly':
        groupBy = {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          label: {
            $first: {
              $concat: [
                { $toString: "$_id.year" }, "-",
                { $toString: { $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }] } }
              ]
            }
          }
        };
        sortBy = { "_id.year": 1, "_id.month": 1 };
        break;
      case 'weekly':
        groupBy = {
          _id: {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" }
          },
          label: {
            $first: {
              $concat: [
                { $toString: "$_id.year" }, "-W",
                { $toString: "$_id.week" }
              ]
            }
          },
          firstDay: { $min: "$createdAt" }
        };
        sortBy = { "_id.year": 1, "_id.week": 1 };
        break;
      case 'daily':
      default:
        groupBy = {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          label: { $first: "$_id" }
        };
        sortBy = { "_id": 1 };
        break;
    }

    // Add common aggregation fields
    const commonFields = {
      totalSales: { $sum: "$totalAmount" },
      orderCount: { $sum: 1 },
      averageOrderValue: { $avg: "$totalAmount" },
      productCount: { $sum: { $size: "$products" } }
    };

    // Combine groupBy and commonFields
    const groupStage = {
      ...groupBy,
      ...commonFields
    };

    // Run the aggregation
    const salesData = await Order.aggregate([
      { $match: filter },
      { $group: groupStage },
      { $sort: sortBy },
      { $limit: parseInt(limit) }
    ]);

    // Calculate summary statistics
    const summary = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: "$totalAmount" },
          minOrderValue: { $min: "$totalAmount" },
          maxOrderValue: { $max: "$totalAmount" }
        }
      }
    ]);

    // Get top selling products if category filter is applied
    let topProducts = [];
    if (category) {
      topProducts = await Order.aggregate([
        { $match: filter },
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.product",
            totalQuantity: { $sum: "$products.quantity" },
            totalRevenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails"
          }
        },
        {
          $project: {
            _id: 1,
            totalQuantity: 1,
            totalRevenue: 1,
            name: { $arrayElemAt: ["$productDetails.name", 0] },
            category: { $arrayElemAt: ["$productDetails.category", 0] }
          }
        }
      ]);
    }

    res.status(200).json({
      success: true,
      data: {
        salesData,
        summary: summary.length > 0 ? summary[0] : {
          totalSales: 0,
          orderCount: 0,
          averageOrderValue: 0,
          minOrderValue: 0,
          maxOrderValue: 0
        },
        topProducts,
        period,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          category: category || null
        }
      }
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({
      success: false,
      message: "Error generating sales report",
      error: error.message
    });
  }
});

/**
 * Get inventory status report
 * @route GET /api/reports/inventory
 * @access Private (Admin, Manager)
 */
const getInventoryReport = asyncHandler(async (req, res) => {
  try {
    // Extract query parameters
    const {
      category,
      lowStockThreshold = 10,
      sortBy = 'quantity',
      sortOrder = 'asc',
      limit = 100
    } = req.query;

    // Build filter
    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Determine sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get inventory data
    const inventoryData = await Product.find(filter)
      .select("name category quantity price sku createdAt updatedAt")
      .sort(sort)
      .limit(parseInt(limit));

    // Get low stock products
    const lowStockProducts = await Product.find({
      ...filter,
      quantity: { $lte: parseInt(lowStockThreshold) }
    })
      .select("name category quantity price sku")
      .sort({ quantity: 1 });

    // Get inventory summary by category
    const inventorySummary = await Product.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: [{ $toDouble: "$price" }, { $toDouble: "$quantity" }] } },
          averagePrice: { $avg: { $toDouble: "$price" } },
          lowStockCount: {
            $sum: {
              $cond: [
                { $lte: [{ $toDouble: "$quantity" }, parseInt(lowStockThreshold)] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get overall inventory statistics
    const inventoryStats = await Product.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: [{ $toDouble: "$price" }, { $toDouble: "$quantity" }] } },
          averagePrice: { $avg: { $toDouble: "$price" } },
          totalQuantity: { $sum: { $toDouble: "$quantity" } },
          lowStockCount: {
            $sum: {
              $cond: [
                { $lte: [{ $toDouble: "$quantity" }, parseInt(lowStockThreshold)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        inventoryData,
        lowStockProducts,
        inventorySummary,
        inventoryStats: inventoryStats.length > 0 ? inventoryStats[0] : {
          totalProducts: 0,
          totalValue: 0,
          averagePrice: 0,
          totalQuantity: 0,
          lowStockCount: 0
        },
        filters: {
          category: category || null,
          lowStockThreshold: parseInt(lowStockThreshold)
        }
      }
    });
  } catch (error) {
    console.error("Error generating inventory report:", error);
    res.status(500).json({
      success: false,
      message: "Error generating inventory report",
      error: error.message
    });
  }
});

/**
 * Get order fulfillment report
 * @route GET /api/reports/orders
 * @access Private (Admin, Manager)
 */
const getOrderFulfillmentReport = asyncHandler(async (req, res) => {
  try {
    // Extract query parameters
    const {
      startDate,
      endDate,
      status,
      period = 'daily', // daily, weekly, monthly, yearly
      limit = 100
    } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate) };
    }

    // Build status filter
    const statusFilter = status && status !== 'all' ? { status } : {};

    // Combine filters
    const filter = {
      ...dateFilter,
      ...statusFilter
    };

    // Define grouping based on period
    let groupBy;
    let sortBy;

    switch (period) {
      case 'yearly':
        groupBy = {
          _id: { year: { $year: "$createdAt" } },
          label: { $first: { $toString: "$_id.year" } }
        };
        sortBy = { "_id.year": 1 };
        break;
      case 'monthly':
        groupBy = {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          label: {
            $first: {
              $concat: [
                { $toString: "$_id.year" }, "-",
                { $toString: { $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }] } }
              ]
            }
          }
        };
        sortBy = { "_id.year": 1, "_id.month": 1 };
        break;
      case 'weekly':
        groupBy = {
          _id: {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" }
          },
          label: {
            $first: {
              $concat: [
                { $toString: "$_id.year" }, "-W",
                { $toString: "$_id.week" }
              ]
            }
          }
        };
        sortBy = { "_id.year": 1, "_id.week": 1 };
        break;
      case 'daily':
      default:
        groupBy = {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          label: { $first: "$_id" }
        };
        sortBy = { "_id": 1 };
        break;
    }

    // Get order counts by status
    const orderStatusCounts = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format status counts
    const formattedStatusCounts = {};
    orderStatusCounts.forEach(item => {
      formattedStatusCounts[item._id] = item.count;
    });

    // Get order fulfillment time statistics
    const fulfillmentTimeStats = await Order.aggregate([
      {
        $match: {
          ...filter,
          status: { $in: ["Delivered", "Shipped"] }
        }
      },
      { $unwind: "$statusHistory" },
      {
        $group: {
          _id: "$_id",
          createdAt: { $first: "$createdAt" },
          approvedAt: {
            $max: {
              $cond: [
                { $eq: ["$statusHistory.status", "Approved"] },
                "$statusHistory.timestamp",
                null
              ]
            }
          },
          shippedAt: {
            $max: {
              $cond: [
                { $eq: ["$statusHistory.status", "Shipped"] },
                "$statusHistory.timestamp",
                null
              ]
            }
          },
          deliveredAt: {
            $max: {
              $cond: [
                { $eq: ["$statusHistory.status", "Delivered"] },
                "$statusHistory.timestamp",
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          approvalTime: {
            $cond: [
              { $and: ["$approvedAt", "$createdAt"] },
              { $divide: [{ $subtract: ["$approvedAt", "$createdAt"] }, 3600000] }, // hours
              null
            ]
          },
          shippingTime: {
            $cond: [
              { $and: ["$shippedAt", "$approvedAt"] },
              { $divide: [{ $subtract: ["$shippedAt", "$approvedAt"] }, 3600000] }, // hours
              null
            ]
          },
          deliveryTime: {
            $cond: [
              { $and: ["$deliveredAt", "$shippedAt"] },
              { $divide: [{ $subtract: ["$deliveredAt", "$shippedAt"] }, 3600000] }, // hours
              null
            ]
          },
          totalFulfillmentTime: {
            $cond: [
              { $and: ["$deliveredAt", "$createdAt"] },
              { $divide: [{ $subtract: ["$deliveredAt", "$createdAt"] }, 3600000] }, // hours
              null
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgApprovalTime: { $avg: "$approvalTime" },
          avgShippingTime: { $avg: "$shippingTime" },
          avgDeliveryTime: { $avg: "$deliveryTime" },
          avgTotalFulfillmentTime: { $avg: "$totalFulfillmentTime" },
          minTotalFulfillmentTime: { $min: "$totalFulfillmentTime" },
          maxTotalFulfillmentTime: { $max: "$totalFulfillmentTime" }
        }
      }
    ]);

    // Get order trend over time
    const orderTrend = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          ...groupBy,
          totalOrders: { $sum: 1 },
          pendingOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "Pending"] }, 1, 0]
            }
          },
          approvedOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "Approved"] }, 1, 0]
            }
          },
          shippedOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "Shipped"] }, 1, 0]
            }
          },
          deliveredOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0]
            }
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0]
            }
          }
        }
      },
      { $sort: sortBy },
      { $limit: parseInt(limit) }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusCounts: formattedStatusCounts,
        fulfillmentTimeStats: fulfillmentTimeStats.length > 0 ? fulfillmentTimeStats[0] : {
          avgApprovalTime: 0,
          avgShippingTime: 0,
          avgDeliveryTime: 0,
          avgTotalFulfillmentTime: 0,
          minTotalFulfillmentTime: 0,
          maxTotalFulfillmentTime: 0
        },
        orderTrend,
        period,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          status: status || null
        }
      }
    });
  } catch (error) {
    console.error("Error generating order fulfillment report:", error);
    res.status(500).json({
      success: false,
      message: "Error generating order fulfillment report",
      error: error.message
    });
  }
});

/**
 * Get product performance report
 * @route GET /api/reports/products
 * @access Private (Admin, Manager)
 */
const getProductPerformanceReport = asyncHandler(async (req, res) => {
  try {
    // Extract query parameters
    const {
      startDate,
      endDate,
      category,
      sortBy = 'totalRevenue',
      sortOrder = 'desc',
      limit = 20
    } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate) };
    }

    // Build category filter
    const categoryFilter = category && category !== 'all' ? { "products.product.category": category } : {};

    // Combine filters
    const filter = {
      ...dateFilter,
      ...categoryFilter,
      status: { $ne: "Cancelled" } // Exclude cancelled orders
    };

    // Determine sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get product performance data
    const productPerformance = await Order.aggregate([
      { $match: filter },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalQuantity: { $sum: "$products.quantity" },
          totalRevenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
          orderCount: { $sum: 1 },
          averageOrderQuantity: { $avg: "$products.quantity" }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $project: {
          _id: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1,
          averageOrderQuantity: 1,
          name: { $arrayElemAt: ["$productDetails.name", 0] },
          category: { $arrayElemAt: ["$productDetails.category", 0] },
          price: { $arrayElemAt: ["$productDetails.price", 0] },
          sku: { $arrayElemAt: ["$productDetails.sku", 0] }
        }
      },
      { $sort: sort },
      { $limit: parseInt(limit) }
    ]);

    // Get category performance summary
    const categoryPerformance = await Order.aggregate([
      { $match: filter },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $group: {
          _id: { $arrayElemAt: ["$productDetails.category", 0] },
          totalQuantity: { $sum: "$products.quantity" },
          totalRevenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
          productCount: { $addToSet: "$products.product" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          productCount: { $size: "$productCount" },
          orderCount: 1,
          averageRevenuePerProduct: { $divide: ["$totalRevenue", { $size: "$productCount" }] }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        productPerformance,
        categoryPerformance,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          category: category || null,
          sortBy,
          sortOrder
        }
      }
    });
  } catch (error) {
    console.error("Error generating product performance report:", error);
    res.status(500).json({
      success: false,
      message: "Error generating product performance report",
      error: error.message
    });
  }
});

/**
 * Export report to CSV
 * @route GET /api/reports/:reportType/export
 * @access Private (Admin, Manager)
 */
const exportReportToCSV = asyncHandler(async (req, res) => {
  try {
    const { reportType } = req.params;
    const { format = 'csv' } = req.query;

    let data;
    let fields;
    let filename;

    // Get report data based on report type
    switch (reportType) {
      case 'sales':
        const salesResponse = await getSalesReport(req, { json: (data) => data });
        data = salesResponse.data.salesData;
        fields = ['label', 'totalSales', 'orderCount', 'averageOrderValue', 'productCount'];
        filename = `sales_report_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'inventory':
        const inventoryResponse = await getInventoryReport(req, { json: (data) => data });
        data = inventoryResponse.data.inventoryData;
        fields = ['name', 'category', 'quantity', 'price', 'sku'];
        filename = `inventory_report_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'orders':
        const ordersResponse = await getOrderFulfillmentReport(req, { json: (data) => data });
        data = ordersResponse.data.orderTrend;
        fields = ['label', 'totalOrders', 'pendingOrders', 'approvedOrders', 'shippedOrders', 'deliveredOrders', 'cancelledOrders'];
        filename = `order_fulfillment_report_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'products':
        const productsResponse = await getProductPerformanceReport(req, { json: (data) => data });
        data = productsResponse.data.productPerformance;
        fields = ['name', 'category', 'sku', 'totalQuantity', 'totalRevenue', 'orderCount', 'averageOrderQuantity'];
        filename = `product_performance_report_${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type"
        });
    }

    if (format === 'csv') {
      // Convert data to CSV
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(data);

      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);

      // Send CSV data
      return res.status(200).send(csv);
    } else if (format === 'pdf') {
      // Generate PDF report
      const pdfBuffer = await generateReportPDF(reportType, data, fields);

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);

      // Send PDF data
      return res.status(200).send(pdfBuffer);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid export format. Supported formats: csv, pdf"
      });
    }
  } catch (error) {
    console.error("Error exporting report:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting report",
      error: error.message
    });
  }
});

/**
 * Generate PDF report
 * @param {string} reportType - Type of report
 * @param {Array} data - Report data
 * @param {Array} fields - Fields to include in the report
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateReportPDF = (reportType, data, fields) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
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

      // Add title
      doc.fontSize(20)
        .text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, { align: 'center' })
        .moveDown();

      // Add date
      doc.fontSize(12)
        .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
        .moveDown(2);

      // Add table header
      const tableTop = 150;
      const tableLeft = 50;
      const colWidth = (doc.page.width - 100) / fields.length;

      // Draw header
      doc.fontSize(10).font('Helvetica-Bold');
      fields.forEach((field, i) => {
        const x = tableLeft + i * colWidth;
        doc.text(
          field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
          x,
          tableTop,
          { width: colWidth, align: 'left' }
        );
      });

      // Draw horizontal line
      doc.moveTo(tableLeft, tableTop + 20)
        .lineTo(tableLeft + fields.length * colWidth, tableTop + 20)
        .stroke();

      // Draw data rows
      let y = tableTop + 30;
      doc.font('Helvetica');

      data.forEach((item, rowIndex) => {
        // Check if we need a new page
        if (y > doc.page.height - 50) {
          doc.addPage();
          y = 50;

          // Redraw header on new page
          doc.fontSize(10).font('Helvetica-Bold');
          fields.forEach((field, i) => {
            const x = tableLeft + i * colWidth;
            doc.text(
              field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
              x,
              y,
              { width: colWidth, align: 'left' }
            );
          });

          // Draw horizontal line
          doc.moveTo(tableLeft, y + 20)
            .lineTo(tableLeft + fields.length * colWidth, y + 20)
            .stroke();

          y += 30;
          doc.font('Helvetica');
        }

        // Draw row data
        fields.forEach((field, i) => {
          const x = tableLeft + i * colWidth;
          let value = item[field];

          // Format values
          if (field === 'totalSales' || field === 'totalRevenue' || field === 'averageOrderValue' || field === 'price') {
            value = `$${Number(value).toFixed(2)}`;
          } else if (typeof value === 'number') {
            value = value.toString();
          } else if (value === undefined || value === null) {
            value = '';
          }

          doc.text(value, x, y, { width: colWidth, align: 'left' });
        });

        y += 20;

        // Draw light horizontal line between rows
        if (rowIndex < data.length - 1) {
          doc.strokeColor('#dddddd')
            .moveTo(tableLeft, y - 10)
            .lineTo(tableLeft + fields.length * colWidth, y - 10)
            .stroke()
            .strokeColor('#000000');
        }
      });

      // Add footer
      const footerTop = doc.page.height - 50;
      doc.fontSize(10)
        .text('Inventory Management System', 50, footerTop, { align: 'center', width: doc.page.width - 100 })
        .moveDown(0.5)
        .fontSize(8)
        .text('This is a computer-generated report.', 50, footerTop + 15, { align: 'center', width: doc.page.width - 100 });

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  getSalesReport,
  getInventoryReport,
  getOrderFulfillmentReport,
  getProductPerformanceReport,
  exportReportToCSV
};