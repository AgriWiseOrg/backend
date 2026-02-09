const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const MarketPrice = require('../models/MarketPrice');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('🍃 Connected to DB for Indexing');

        // Explicitly create indexes defined in Schema
        await MarketPrice.createIndexes();
        console.log('✅ Indexes Created/Updated');

        // Limit Query Test
        console.time('IndexedQuery');
        await MarketPrice.find({ crop: 'Wheat' }).sort({ date: -1 }).limit(10);
        console.timeEnd('IndexedQuery');

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
