const mongoose = require('mongoose');

const GovtSchemeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    benefit: { type: String, required: true },
    minLand: { type: Number, required: true },
    maxLand: { type: Number, required: true },
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GovtScheme', GovtSchemeSchema);
