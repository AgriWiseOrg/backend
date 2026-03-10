const mongoose = require('mongoose');
const Product = require('../models/Products'); // Points to Products.js

describe('Product Model Unit Tests', () => {

    // 1. Validation for Required Fields
    test('should fail if required fields are missing', async () => {
        const product = new Product({}); // Empty object
        let err;
        try {
            await product.validate();
        } catch (error) {
            err = error;
        }
        expect(err.errors.name).toBeDefined();
        expect(err.errors.crop).toBeDefined();
        expect(err.errors.price).toBeDefined();
        expect(err.errors.farmerId).toBeDefined();
    });

    // 2. Validation for Safety Constraints (Min 0)
    test('should fail if price or quantity is negative', async () => {
        const product = new Product({
            name: 'Organic Rice',
            crop: 'Rice',
            price: -10, // Invalid
            quantity: -5, // Invalid
            location: 'Coimbatore',
            farmerName: 'Ramesh',
            farmerId: new mongoose.Types.ObjectId()
        });

        let err;
        try {
            await product.validate();
        } catch (error) {
            err = error;
        }
        expect(err.errors.price.message).toBe('Price cannot be negative');
        expect(err.errors.quantity.message).toBe('Quantity cannot be negative');
    });

    // 3. Successful Creation with Defaults and Trim
    test('should apply default values and trim name', async () => {
        const validData = {
            name: '  Fresh Tomatoes  ', // Testing trim
            crop: 'Tomato',
            price: 50,
            quantity: 100,
            location: 'Coimbatore',
            farmerName: 'Anil',
            farmerId: new mongoose.Types.ObjectId()
        };

        const product = new Product(validData);

        // Verify Trim logic
        expect(product.name).toBe('Fresh Tomatoes');
        // Verify Schema Defaults
        expect(product.description).toBe("Fresh harvest from local fields.");
        expect(product.rating).toBe(4.5);

        const err = await product.validate();
        expect(err).toBeUndefined(); // Passes validation
    });
});
