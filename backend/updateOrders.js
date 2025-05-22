require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/order');

async function updateOrders() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Get all delivered orders
    const deliveredOrders = await Order.find({ status: 'Delivered' });
    console.log(`Found ${deliveredOrders.length} delivered orders`);
    
    // Update all delivered orders to have a payment status of "Paid"
    const updateResult = await Order.updateMany(
      { status: 'Delivered' },
      { $set: { paymentStatus: 'Paid' } }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} orders to "Paid" payment status`);
    
    // Create a recent order for today with "Paid" status
    const today = new Date();
    const todayOrder = new Order({
      customer: '65f9c5d1e5c5e4a8b3f9e5c5', // Replace with a valid user ID
      products: [
        {
          product: '65f9c5d1e5c5e4a8b3f9e5c6', // Replace with a valid product ID
          quantity: 3,
          price: 49.99
        }
      ],
      totalAmount: 149.97,
      status: 'Delivered',
      paymentStatus: 'Paid',
      createdAt: today,
      updatedAt: today,
      shippingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      }
    });
    
    await todayOrder.save();
    console.log('Created a new order for today with "Paid" status');
    
    // Create an order for yesterday with "Paid" status
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayOrder = new Order({
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
      createdAt: yesterday,
      updatedAt: yesterday,
      shippingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      }
    });
    
    await yesterdayOrder.save();
    console.log('Created a new order for yesterday with "Paid" status');
    
    // Check total sales after updates
    const totalSales = await Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    console.log(`\nTotal sales after updates: $${totalSales.length > 0 ? totalSales[0].total : 0}`);
    
    // Get today's sales
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todaySales = await Order.aggregate([
      { $match: { createdAt: { $gte: todayStart }, paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    console.log(`Today's sales after updates: $${todaySales.length > 0 ? todaySales[0].total : 0}`);
    
    // Get yesterday's sales
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    
    const yesterdaySales = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: yesterdayStart, $lt: yesterdayEnd }, 
          paymentStatus: 'Paid' 
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    console.log(`Yesterday's sales after updates: $${yesterdaySales.length > 0 ? yesterdaySales[0].total : 0}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateOrders();
