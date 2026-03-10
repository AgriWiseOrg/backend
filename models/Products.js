const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    crop: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'] // Safety check
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Quantity cannot be negative'] // Safety check
    },
    unit: {
        type: String,
        default: 'Quintal'
    },
    description: {
        type: String,
        default: "Fresh harvest from local fields."
    },
    location: {
        type: String,
        required: true
    },
    farmerName: {
        type: String,
        required: true
    },
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviews: [{
        user: { type: String, required: true },
        userId: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true },
        date: { type: Date, default: Date.now }
    }],
    imageUrl: {
        type: String,
        default: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=400"
    }
}, {
    timestamps: true
});

// Bidding Fields
productSchema.add({
    isBiddingActive: { type: Boolean, default: false },
    currentBid: { type: Number, default: 0 },
    highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    highestBidderName: { type: String },
    biddingEndTime: { type: Date },
    bids: [{
        bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        bidderName: { type: String },
        amount: { type: Number },
        timestamp: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);