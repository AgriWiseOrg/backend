const mongoose = require('mongoose');

const DemandForecastSchema = new mongoose.Schema({
    crop: { type: String, required: true },
    demandLevel: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    percentage: { type: Number, required: true }, // 0-100
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DemandForecast', DemandForecastSchema);
