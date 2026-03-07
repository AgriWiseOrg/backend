const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['farmer', 'buyer', 'admin'],
    default: 'farmer'
  },
  profile: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    // Farmer specific
    farmSize: { type: String, default: '' },
    farmingType: { type: String, default: '' }, 
    // Buyer specific
    companyName: { type: String, default: '' },
    businessType: { type: String, default: '' }, 
    // Admin specific
    department: { type: String, default: '' },
    employeeId: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
