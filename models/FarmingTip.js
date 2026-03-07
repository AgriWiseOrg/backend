const mongoose = require('mongoose');

const FarmingTipSchema = new mongoose.Schema({
    title: { type: String, required: true },
    desc: { type: String, required: true }, // Changed from description to match frontend
    iconType: { type: String, default: 'sprout' },
    color: { type: String, default: 'text-green-600' },
    category: { type: String, default: 'General' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FarmingTip', FarmingTipSchema);
