const mongoose = require('mongoose');

const MarketPriceSchema = new mongoose.Schema({
    crop: { type: String, required: true, index: true },
    market: { type: String, required: true, index: true },
    state: { type: String, required: true },
    price: { type: Number, required: true },
    date: { type: Date, default: Date.now, index: true },
    trend: { type: String } // 'up', 'down', 'stable'
});

module.exports = mongoose.model('MarketPrice', MarketPriceSchema);
