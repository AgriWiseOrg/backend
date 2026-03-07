const mongoose = require('mongoose');

const FinanceRequestSchema = new mongoose.Schema({
  farmerEmail: { type: String, required: true },
  schemeName: { type: String, required: true },
  schemeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme' },
  interestRate: { type: String },
  status: { type: String, default: 'Pending' }, 
  appliedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FinanceRequest', FinanceRequestSchema);