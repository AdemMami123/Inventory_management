const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const mongoose = require("mongoose");

/**
 * Get comprehensive dashboard statistics for admin/manager
 * Includes:
 * - Sales metrics with time comparisons
 * - Order statistics
 * - Inventory status
 * - User statistics
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Time periods for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // 1. Sales Metrics
    // Today's sales
    const todaySales = await Order.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    // Yesterday's sales
    const yesterdaySales = await Order.aggregate([
      { $match: { createdAt: { $gte: yesterday, $lt: today } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    // This week's sales
    const thisWeekSales = await Order.aggregate([
      { $match: { createdAt: { $gte: thisWeekStart } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    // Last week's sales
    const lastWeekSales = await Order.aggregate([
      { $match: { createdAt: { $gte: lastWeekStart, $lt: thisWeekStart } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    // This month's sales
    const thisMonthSales = await Order.aggregate([
      { $match: { createdAt: { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    // Last month's sales
    const lastMonthSales = await Order.aggregate([
      { $match: { createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // 2. Order Statistics
    // Get counts by status
    const statusCounts = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Format the status counts into a more usable object
    const formattedStatusCounts = {};
    statusCounts.forEach(item => {
      formattedStatusCounts[item._id] = item.count;
    });

    // Total orders
    const totalOrders = Object.values(formattedStatusCounts).reduce((sum, count) => sum + count, 0);

    // Today's orders
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    
    // Yesterday's orders
    const yesterdayOrders = await Order.countDocuments({ 
      createdAt: { $gte: yesterday, $lt: today } 
    });

    // 3. Inventory Status
    // Low stock products (less than 10 units)
    const lowStockProducts = await Product.find({ quantity: { $lt: 10 } })
      .select("name category quantity price sku")
      .sort({ quantity: 1 })
      .limit(10);
    
    // Product count by category
    const productsByCategory = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 4. User Statistics
    const userCounts = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    // Format user counts
    const formattedUserCounts = {};
    userCounts.forEach(item => {
      formattedUserCounts[item._id] = item.count;
    });

    // 5. Time Series Data for Charts
    // Daily sales for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailySalesData = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Weekly sales for the last 12 weeks
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks * 7 days
    
    const weeklySalesData = await Order.aggregate([
      { $match: { createdAt: { $gte: twelveWeeksAgo } } },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" }
          },
          sales: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
          firstDay: { $min: "$createdAt" }
        }
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
      {
        $project: {
          _id: 0,
          week: {
            $dateToString: { format: "%Y-%m-%d", date: "$firstDay" }
          },
          sales: 1,
          orders: 1
        }
      }
    ]);

    // Monthly sales for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const monthlySalesData = await Order.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          sales: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: "$_id.year" }, "-",
              { $toString: { $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }] } }
            ]
          },
          sales: 1,
          orders: 1
        }
      }
    ]);

    // Calculate percentage changes
    const dailySalesChange = calculatePercentageChange(
      todaySales[0]?.total || 0,
      yesterdaySales[0]?.total || 0
    );
    
    const weeklySalesChange = calculatePercentageChange(
      thisWeekSales[0]?.total || 0,
      lastWeekSales[0]?.total || 0
    );
    
    const monthlySalesChange = calculatePercentageChange(
      thisMonthSales[0]?.total || 0,
      lastMonthSales[0]?.total || 0
    );

    const dailyOrdersChange = calculatePercentageChange(
      todayOrders,
      yesterdayOrders
    );

    // Compile and return all statistics
    res.status(200).json({
      success: true,
      data: {
        sales: {
          daily: {
            current: todaySales[0]?.total || 0,
            previous: yesterdaySales[0]?.total || 0,
            change: dailySalesChange
          },
          weekly: {
            current: thisWeekSales[0]?.total || 0,
            previous: lastWeekSales[0]?.total || 0,
            change: weeklySalesChange
          },
          monthly: {
            current: thisMonthSales[0]?.total || 0,
            previous: lastMonthSales[0]?.total || 0,
            change: monthlySalesChange
          },
          timeSeries: {
            daily: dailySalesData,
            weekly: weeklySalesData,
            monthly: monthlySalesData
          }
        },
        orders: {
          total: totalOrders,
          byStatus: formattedStatusCounts,
          daily: {
            current: todayOrders,
            previous: yesterdayOrders,
            change: dailyOrdersChange
          }
        },
        inventory: {
          lowStock: lowStockProducts,
          byCategory: productsByCategory
        },
        users: formattedUserCounts
      }
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message
    });
  }
});

/**
 * Get customer dashboard statistics
 * Includes:
 * - Order summary
 * - Recent orders
 * - Personalized recommendations
 */
const getCustomerDashboardStats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // Get customer's orders
    const orders = await Order.find({ customer: userId })
      .populate("products.product", "name price image")
      .sort({ createdAt: -1 });

    // Calculate order statistics
    const totalOrders = orders.length;
    const recentOrders = orders.slice(0, 5); // Last 5 orders
    
    // Count orders by status
    const ordersByStatus = {};
    orders.forEach(order => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    // Calculate total spent
    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Get personalized product recommendations
    // For now, we'll just get products from categories the customer has ordered before
    const orderedCategories = new Set();
    orders.forEach(order => {
      order.products.forEach(item => {
        if (item.product && item.product.category) {
          orderedCategories.add(item.product.category);
        }
      });
    });

    // Get products from those categories (excluding ones with 0 quantity)
    const recommendedProducts = await Product.find({
      category: { $in: Array.from(orderedCategories) },
      quantity: { $gt: 0 }
    })
    .limit(4)
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        orderSummary: {
          total: totalOrders,
          byStatus: ordersByStatus,
          totalSpent
        },
        recentOrders,
        recommendations: recommendedProducts
      }
    });
  } catch (error) {
    console.error("Customer dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer dashboard statistics",
      error: error.message
    });
  }
});

// Helper function to calculate percentage change
function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

module.exports = {
  getDashboardStats,
  getCustomerDashboardStats
};
