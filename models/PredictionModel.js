const mongoose = require('mongoose');

const PredictionModelSchema = new mongoose.Schema({
    crop: { type: String, required: true, unique: true },
    slope: { type: Number, required: true },
    intercept: { type: Number, required: true },
    sampleSize: { type: Number, required: true },
    lastTrained: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PredictionModel', PredictionModelSchema);
