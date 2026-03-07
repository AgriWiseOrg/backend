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
        default: 4.5,
        min: 0,
        max: 5 // Prevents invalid ratings
    },
    imageUrl: { 
        type: String, 
        default: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=400" 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);