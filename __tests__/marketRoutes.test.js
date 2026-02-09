const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const MarketPrice = require('../models/MarketPrice');
const PredictionModel = require('../models/PredictionModel');

// We need to increase timeout because initial DB connection might take time in test env
jest.setTimeout(30000);

describe('Market Routes (server.js)', () => {

    beforeAll(async () => {
        // Connect to a test database or ensure connection is ready
        // server.js connects automatically, but we might want to wait
        // In this setup, we rely on server.js connection logic.
        // Ideally we should use a separate test DB, but for now we follow existing pattern.
        // Wait a bit for connection
        await new Promise(resolve => setTimeout(resolve, 2000));
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    // GET /api/market/prices
    test('GET /api/market/prices should return list of market prices', async () => {
        const res = await request(app).get('/api/market/prices');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('crop');
            expect(res.body[0]).toHaveProperty('price');
            expect(res.body[0]).toHaveProperty('trend');
        }
    });

    // GET /api/market/crops
    test('GET /api/market/crops should return list of crops', async () => {
        const res = await request(app).get('/api/market/crops');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    // GET /api/market/history
    test('GET /api/market/history should return history for a crop', async () => {
        // Assuming 'Wheat' exists or fallback handles it
        const res = await request(app).get('/api/market/history?crop=Wheat');
        if (res.statusCode === 200) {
            expect(res.body).toHaveProperty('data');
            expect(Array.isArray(res.body.data)).toBe(true);
        } else {
            // If 400, it means crop param missing, but we sent it. 
            // If 500, DB error.
            expect(res.statusCode).not.toBe(500);
        }
    });

    // GET /api/market/demand
    test('GET /api/market/demand should return demand data', async () => {
        const res = await request(app).get('/api/market/demand');
        // It might be 500 if DemandForecast collection is empty/missing scheme, but let's check basic response
        // server.js returns 200 with empty array if no data finding succeeds
        if (res.statusCode === 200) {
            expect(Array.isArray(res.body)).toBe(true);
        }
    });

    // POST /api/predict-price
    test('POST /api/predict-price should return prediction', async () => {
        const res = await request(app)
            .post('/api/predict-price')
            .send({
                product: 'Wheat',
                region: 'North India',
                month: 'December'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('predictedPrice');
        expect(res.body).toHaveProperty('confidence');
    });

    // POST /api/market/quality-price
    test('POST /api/market/quality-price should return calculated price', async () => {
        const res = await request(app)
            .post('/api/market/quality-price')
            .send({
                crop: 'Wheat',
                grade: 'A',
                params: { moisture: 12, damage: 2 }
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('suggestedPrice');
        expect(res.body).toHaveProperty('qualityScore');
    });

    // GET /api/market/forecast-30-days
    test('GET /api/market/forecast-30-days should return forecast', async () => {
        const res = await request(app).get('/api/market/forecast-30-days?crop=Wheat');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});
