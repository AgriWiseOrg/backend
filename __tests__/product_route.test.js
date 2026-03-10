const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Import your app from server.js
const Product = require('../models/Products'); //

describe('Product API Route Tests', () => {
    
    // Clean database before testing to ensure a fresh state
    beforeAll(async () => {
        await Product.deleteMany({});
    });

    // Close database connection after all tests
    afterAll(async () => {
        
    });

    // UNIT TEST: GET ALL PRODUCTS
    test('GET /api/products - should return all crops', async () => {
        const response = await request(app).get('/api/products');
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    // UNIT TEST: CREATE PRODUCT (POST)
    test('POST /api/products - should successfully list a new crop', async () => {
        const newCrop = {
            name: "Vatakara Rice",
            crop: "Rice",
            price: 2800,
            quantity: 45,
            location: "Kerala",
            farmerName: "Ramesh",
            farmerId: new mongoose.Types.ObjectId().toString()
        };

        const response = await request(app)
            .post('/api/products')
            .send(newCrop);

        expect(response.status).toBe(201); // 201 Created
        expect(response.body.name).toBe("Vatakara Rice");
    });

    // UNIT TEST: VALIDATION FAILURE
    test('POST /api/products - should return 400 for negative price', async () => {
        const badCrop = {
            name: "Bad Price",
            crop: "Wheat",
            price: -100, // Invalid based on our Model check
            location: "Punjab",
            farmerName: "Suresh",
            farmerId: new mongoose.Types.ObjectId().toString()
        };

        const response = await request(app)
            .post('/api/products')
            .send(badCrop);

        expect(response.status).toBe(400); // Should fail validation
    });
});
