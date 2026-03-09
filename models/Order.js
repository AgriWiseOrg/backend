const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    buyerEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    farmerEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    items: [
        {
            productId: { type: String, required: true },
            crop: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            imageUrl: { type: String }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    deliveryDetails: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true }
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
