const mongoose = require('mongoose');

const FinanceSchemeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true }, // e.g., Loan, Subsidy, Insurance
    interest: { type: String, required: true }, // e.g., "4% p.a."
    color: { type: String, default: 'indigo' }, // UI theme color
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FinanceScheme', FinanceSchemeSchema);
