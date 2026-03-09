const mongoose = require('mongoose');

const SchemeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  benefit: { type: String }, // e.g., "₹6,000/year"
  minLand: { type: Number },
  maxLand: { type: Number },
  type: { type: String }, // Optional compatibility
  interest: { type: String }, // Optional compatibility
  tag: { type: String },
  color: { type: String, default: "emerald" },
  description: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Scheme', SchemeSchema);