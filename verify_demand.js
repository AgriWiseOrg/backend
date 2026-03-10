const mongoose = require('mongoose');
require('dotenv').config();

const DemandForecastSchema = new mongoose.Schema({
    crop: { type: String, required: true },
    demandLevel: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    percentage: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

const DemandForecast = mongoose.model('DemandForecast', DemandForecastSchema);

async function checkDemand() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/AgriWise');
        console.log('Connected to MongoDB');

        const count = await DemandForecast.countDocuments({});
        console.log(`Total DemandForecast records: ${count}`);

        const ajwan = await DemandForecast.findOne({ crop: 'Ajwan' });
        console.log('Ajwan Demand:', ajwan);

        const wheat = await DemandForecast.findOne({ crop: 'Wheat' });
        console.log('Wheat Demand:', wheat);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkDemand();
