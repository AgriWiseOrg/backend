const mongoose = require('mongoose');

const LatestUpdateSchema = new mongoose.Schema({
    title: { type: String, required: true },
    desc: { type: String, required: true }, // Changed from news to match frontend
    tag: { type: String, default: 'General' },
    priority: { type: String, default: 'medium' },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LatestUpdate', LatestUpdateSchema);
