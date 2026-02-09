const mongoose = require('mongoose');
require('dotenv').config(); // Should pick up .env in current dir

const MarketPriceSchema = new mongoose.Schema({
    crop: String,
    date: Date,
    price: Number,
    market: String,
    state: String
});
// Check if model already exists to avoid OverwriteModelError
const MarketPrice = mongoose.models.MarketPrice || mongoose.model('MarketPrice', MarketPriceSchema);

const PredictionModelSchema = new mongoose.Schema({
    crop: String,
    slope: Number,
    intercept: Number,
    sampleSize: Number,
    lastTrained: Date
});
const PredictionModel = mongoose.models.PredictionModel || mongoose.model('PredictionModel', PredictionModelSchema);

async function checkData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const crops = await MarketPrice.distinct('crop');
        console.log('Distinct crops in MarketPrice:', crops);

        for (const crop of crops) {
            const count = await MarketPrice.countDocuments({ crop });
            const model = await PredictionModel.findOne({ crop });
            console.log(`Crop: "${crop}", Records: ${count}, Model Exists: ${!!model}`);
        }

        if (crops.length === 0) {
            console.log("No crops found in MarketPrice collection.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

checkData();
