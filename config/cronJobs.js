const cron = require('node-cron');
const Order = require('../models/orderModel');

// Cron job to delete unpaid orders every 1 minute
cron.schedule('*/1 * * * *', async () => {
  // Calculate the cutoff date for 2 minutes ago
  const cutoffDate = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
  try {
    // Find one unpaid order older than 2 minutes
    const order = await Order.deleteMany({
      OrderIsPaid: false,
      createdAt: { $lt: cutoffDate },
    });
    if (order.deletedCount > 0) {
        console.log(`Deleted ${order.deletedCount} unpaid order(s).`);
      }
  } catch (error) {
    console.error('Error deleting unpaid orders:', error);
  }
});
