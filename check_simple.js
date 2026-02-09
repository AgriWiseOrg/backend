const mongoose = require('mongoose');
const MarketPrice = require('./models/MarketPrice');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/AgriWise';

mongoose.connect(uri)
    .then(async () => {
        console.log('MARKET_PRICE_CHECK_START');

        try {
            const count = await MarketPrice.countDocuments();
            console.log(`Total: ${count}`);

            const first = await MarketPrice.findOne({});
            console.log(`First Price: ${first ? first.price : 'N/A'}`);
            console.log(`First Crop: ${first ? first.crop : 'N/A'}`);

            const zeroCount = await MarketPrice.countDocuments({ price: 0 });
            console.log(`Zeros: ${zeroCount}`);

            const wheat = await MarketPrice.findOne({ crop: 'Wheat' });
            console.log(`Wheat Exists: ${!!wheat}`);
            if (wheat) console.log(`Wheat Price: ${wheat.price}`);

        } catch (e) {
            console.error(e);
        }

        console.log('MARKET_PRICE_CHECK_END');
        process.exit(0);
    });
