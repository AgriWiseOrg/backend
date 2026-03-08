const mongoose = require('mongoose');
const MarketPrice = require('./models/MarketPrice');
const PredictionModel = require('./models/PredictionModel');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/AgriWise';

mongoose.connect(uri)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        // 1. Check Wheat Prices
        const prices = await MarketPrice.find({ crop: 'Wheat' });
        console.log(`\n🌾 Found ${prices.length} Wheat Price Records:`);
        if (prices.length > 0) {
            console.log(prices.slice(0, 5).map(p => p.price));
            const avg = prices.reduce((a, b) => a + b.price, 0) / prices.length;
            console.log(`Average Price: ${avg}`);
        }

        // 2. Check Wheat Model
        const model = await PredictionModel.findOne({ crop: 'Wheat' });
        console.log('\n🧠 Saved Prediction Model for Wheat:');
        console.log(model);

        // 3. Clear Model if it looks wrong (e.g. Intercept < 100)
        if (model && model.intercept < 100) {
            console.log('\n⚠️ Model seems trained on low-scale data (per kg). DELETING MODEL...');
            await PredictionModel.deleteOne({ _id: model._id });
            console.log('✅ Model Deleted. Next request will retrain.');
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
