const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:\\Users\\Koppu\\Downloads\\sprint1review\\backend\\.env' });

const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));

async function checkOrders() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const total = await Order.countDocuments();
    console.log(`\nTotal orders in DB: ${total}`);

    if (total > 0) {
        const orders = await Order.find({}).select('buyerEmail farmerEmail status totalAmount createdAt').limit(10);
        console.log('\nSample orders:');
        orders.forEach(o => {
            console.log(`  farmerEmail: ${o.farmerEmail} | buyerEmail: ${o.buyerEmail} | status: ${o.status} | amount: ${o.totalAmount}`);
        });
    }

    await mongoose.disconnect();
}

checkOrders().catch(console.error);
