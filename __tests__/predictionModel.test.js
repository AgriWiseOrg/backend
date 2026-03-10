const mongoose = require('mongoose');
const PredictionModel = require('../models/PredictionModel');
require('dotenv').config();

// We need a connection to test unique constraints and validation fully
describe('PredictionModel Model', () => {

    beforeAll(async () => {
        // Use the URI from .env or a fallback for testing
        // ideally use a test DB, but we will be careful
        const mongoURI = process.env.MONGO_URI;
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(mongoURI);
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    afterEach(async () => {
        // Clean up: Delete the test entries
        await PredictionModel.deleteMany({ crop: 'TestCrop_UnitTest' });
    });

    test('should create a valid prediction model', async () => {
        const validModel = new PredictionModel({
            crop: 'TestCrop_UnitTest',
            slope: 1.5,
            intercept: 100,
            sampleSize: 50
        });
        const savedModel = await validModel.save();
        expect(savedModel._id).toBeDefined();
        expect(savedModel.crop).toBe('TestCrop_UnitTest');
        expect(savedModel.lastTrained).toBeDefined(); // Should have default
    });

    test('should fail validation without required fields', async () => {
        const invalidModel = new PredictionModel({}); // Empty
        let err;
        try {
            await invalidModel.validate();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.crop).toBeDefined();
        expect(err.errors.slope).toBeDefined();
        expect(err.errors.intercept).toBeDefined();
        expect(err.errors.sampleSize).toBeDefined();
    });

    test('should enforcement uniqueness of crop', async () => {
        const model1 = new PredictionModel({
            crop: 'TestCrop_UnitTest',
            slope: 1.0,
            intercept: 10,
            sampleSize: 10
        });
        await model1.save();

        const model2 = new PredictionModel({
            crop: 'TestCrop_UnitTest',
            slope: 2.0,
            intercept: 20,
            sampleSize: 20
        });

        let err;
        try {
            await model2.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        // MongoDB duplicate key error code is 11000
        expect(err.code).toBe(11000);
    });
});
