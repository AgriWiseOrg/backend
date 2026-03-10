const mongoose = require('mongoose');

const GovtSchemeApplicationSchema = new mongoose.Schema({
    farmerEmail: { type: String, required: true },
    schemeId: { type: mongoose.Schema.Types.ObjectId, ref: 'GovtScheme', required: true },
    schemeName: { type: String, required: true },
    status: { type: String, default: 'Pending' }, // Pending, Approved, Rejected
    appliedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GovtSchemeApplication', GovtSchemeApplicationSchema);
