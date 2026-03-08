const mongoose = require('mongoose');
const MarketPrice = require('./models/MarketPrice');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/AgriWise';

mongoose.connect(uri)
    .then(async () => {
        const crops = await MarketPrice.distinct('crop');
        console.log('🌾 Crops in DB:', crops);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
