const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') });
const MarketPrice = require('./models/MarketPrice');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('🍃 Connected');

        console.time('fetchCrops');
        const crops = await MarketPrice.distinct('crop');
        console.timeEnd('fetchCrops');
        console.log(`Found ${crops.length} crops`);
        console.log('Sample:', crops.slice(0, 5));

        console.time('qualityPriceQuery');
        const recent = await MarketPrice.find({ crop: new RegExp('Wheat', 'i') }).limit(10);
        console.timeEnd('qualityPriceQuery');
        console.log(`Found ${recent.length} records for Wheat`);

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
