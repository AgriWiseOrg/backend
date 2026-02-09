const mongoose = require('mongoose');
const DemandForecast = require('../models/DemandForecast');
require('dotenv').config();

describe('DemandForecast Model', () => {

    beforeAll(async () => {
        const mongoURI = process.env.MONGO_URI;
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(mongoURI);
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    afterEach(async () => {
        await DemandForecast.deleteMany({ crop: 'TestCrop_Demand' });
    });

    test('should create a valid demand forecast', async () => {
        const forecast = new DemandForecast({
            crop: 'TestCrop_Demand',
            demandLevel: 'High',
            percentage: 85
        });
        const savedForecast = await forecast.save();
        expect(savedForecast._id).toBeDefined();
        expect(savedForecast.demandLevel).toBe('High');
        expect(savedForecast.date).toBeDefined();
    });

    test('should fail validation for invalid enum value', async () => {
        const forecast = new DemandForecast({
            crop: 'TestCrop_Demand',
            demandLevel: 'SuperHigh', // Invalid
            percentage: 90
        });
        let err;
        try {
            await forecast.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.demandLevel).toBeDefined();
    });

    test('should fail without required fields', async () => {
        const forecast = new DemandForecast({});
        let err;
        try {
            await forecast.validate();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.errors.crop).toBeDefined();
        expect(err.errors.percentage).toBeDefined();
    });
});
