const mongoose = require('mongoose');

const SchemeApplicationSchema = new mongoose.Schema({
    farmerEmail: { type: String, required: true },
    schemeName: { type: String, required: true },
    schemeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme' },
    landSize: { type: String }, // Storing land size used for eligibility
    status: { type: String, default: 'Pending' },
    appliedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SchemeApplication', SchemeApplicationSchema);
