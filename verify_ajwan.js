const mongoose = require('mongoose');
require('dotenv').config();

const MarketPriceSchema = new mongoose.Schema({
    crop: { type: String, required: true, index: true },
    market: { type: String, required: true, index: true },
    state: { type: String, required: true },
    price: { type: Number, required: true },
    date: { type: Date, default: Date.now, index: true },
    trend: { type: String }
});

const MarketPrice = mongoose.model('MarketPrice', MarketPriceSchema);

async function checkAjwan() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AgriWise');
        console.log('Connected to MongoDB');

        const count = await MarketPrice.countDocuments({ crop: 'Ajwan' });
        console.log(`Count of 'Ajwan' records: ${count}`);

        if (count > 0) {
            const sample = await MarketPrice.findOne({ crop: 'Ajwan' });
            console.log('Sample record:', sample);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkAjwan();
