require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/order');

async function checkOrders() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Count total orders
    const orderCount = await Order.countDocuments();
    console.log(`Total orders in database: ${orderCount}`);
    
    if (orderCount === 0) {
      console.log('No orders found. Let\'s create a sample order for testing.');
      
      // Create a sample order
      const sampleOrder = new Order({
        customer: '65f9c5d1e5c5e4a8b3f9e5c5', // Replace with a valid user ID
        products: [
          {
            product: '65f9c5d1e5c5e4a8b3f9e5c6', // Replace with a valid product ID
            quantity: 2,
            price: 29.99
          }
        ],
        totalAmount: 59.98,
        status: 'Delivered',
        paymentStatus: 'Paid',
        shippingAddress: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'USA'
        }
      });
      
      await sampleOrder.save();
      console.log('Sample order created successfully');
    } else {
      // Get all orders with their amounts
      const orders = await Order.find().select('_id totalAmount status paymentStatus createdAt');
      console.log('Orders:');
      orders.forEach(order => {
        console.log(`ID: ${order._id}, Amount: $${order.totalAmount}, Status: ${order.status}, Payment: ${order.paymentStatus}, Date: ${order.createdAt}`);
      });
      
      // Calculate total sales
      const totalSales = await Order.aggregate([
        { $match: { paymentStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      
      console.log(`\nTotal sales: $${totalSales.length > 0 ? totalSales[0].total : 0}`);
      
      // Get today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySales = await Order.aggregate([
        { $match: { createdAt: { $gte: today }, paymentStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      
      console.log(`Today's sales: $${todaySales.length > 0 ? todaySales[0].total : 0}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkOrders();
