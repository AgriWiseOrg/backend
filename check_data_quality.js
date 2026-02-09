const mongoose = require('mongoose');
require('dotenv').config();

// Define models properly
const MarketPriceSchema = new mongoose.Schema({
    crop: { type: String, required: true },
    market: { type: String, required: true },
    state: { type: String, required: true },
    price: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    trend: { type: String }
});

const DemandForecastSchema = new mongoose.Schema({
    crop: { type: String, required: true },
    demandLevel: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    percentage: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

const PredictionModelSchema = new mongoose.Schema({
    crop: { type: String, required: true },
    slope: { type: Number, required: true },
    intercept: { type: Number, required: true },
    sampleSize: { type: Number, required: true },
    lastTrained: { type: Date, default: Date.now }
});

const MarketPrice = mongoose.model('MarketPrice', MarketPriceSchema);
const DemandForecast = mongoose.model('DemandForecast', DemandForecastSchema);
const PredictionModel = mongoose.model('PredictionModel', PredictionModelSchema);

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/AgriWise';

mongoose.connect(uri)
    .then(async () => {
        console.log('🔗 Connected to MongoDB');

        // 1. Check MarketPrice
        const count = await MarketPrice.countDocuments();
        console.log(`📊 MarketPrice Count: ${count}`);

        const sample = await MarketPrice.findOne({});
        console.log('Sample MarketPrice:', sample);

        const zeroPrices = await MarketPrice.countDocuments({ price: 0 });
        console.log(`⚠️ MarketPrice with 0 price: ${zeroPrices}`);

        const stringPrices = await MarketPrice.countDocuments({ price: { $type: "string" } });
        console.log(`⚠️ MarketPrice with String price: ${stringPrices}`);

        // 2. Check DemandForecast
        const demandCount = await DemandForecast.countDocuments();
        console.log(`📊 DemandForecast Count: ${demandCount}`);
        const demandSample = await DemandForecast.findOne({});
        console.log('Sample DemandForecast:', demandSample);

        // 3. Check PredictionModel
        const predictionCount = await PredictionModel.countDocuments();
        console.log(`📊 PredictionModel Count: ${predictionCount}`);
        const predictionSample = await PredictionModel.findOne({});
        console.log('Sample PredictionModel:', predictionSample);

        // 4. Check specific crop: Wheat
        const wheatHistory = await MarketPrice.find({ crop: 'Wheat' }).limit(5);
        console.log('Wheat History:', wheatHistory);

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
