const mongoose = require('mongoose');
const MarketPrice = require('./models/MarketPrice');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/AgriWise';

mongoose.connect(uri)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        const prices = await MarketPrice.find().limit(5);
        if (prices.length > 0) {
            console.log('🔍 Sample Market Prices:', prices.map(p => ({ crop: p.crop, price: p.price })));

            const avg = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
            console.log(`📊 Average Price: ${avg}`);

            if (avg < 100) {
                console.log('⚠️ CONCLUSION: Data stored as PER KG (e.g., 25). Needs x100 for Quintal.');
            } else {
                console.log('✅ CONCLUSION: Data stored as PER QUINTAL (e.g., 2500). No conversion needed.');
            }
        } else {
            console.log('❌ No market prices found.');
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
