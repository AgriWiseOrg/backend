const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    // Unique identifier to link the cart to the user
    userEmail: {
        type: String,
        required: true,
        unique: true, 
        lowercase: true,
        trim: true
    },
    // Array of items in the cart
    items: [
        {
            productId: {
                type: String, 
                required: true
            },
            crop: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
                min: [1, 'Quantity cannot be less than 1']
            },
            imageUrl: {
                type: String
            },
            farmerName: {
                type: String
            }
        }
    ]
}, { 
    // This adds 'createdAt' and 'updatedAt' fields automatically.
    // Mongoose will update 'updatedAt' every time you use .save()
    timestamps: true 
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;