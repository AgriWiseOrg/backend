const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MarketPrice = require('../models/MarketPrice');
const DemandForecast = require('../models/DemandForecast');

const seedDemandSmart = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🍃 Connected to MongoDB');

        // 1. Clear existing Demand Forecasts
        await DemandForecast.deleteMany({});
        console.log('🗑️  Cleared old DemandForecast records.');

        // 2. Get all crops
        const crops = await MarketPrice.distinct('crop');
        console.log(`📍 Found ${crops.length} crops to analyze.`);

        const demandForecasts = [];

        for (const crop of crops) {
            // Get recent price history (last 30 days)
            const history = await MarketPrice.find({ crop })
                .sort({ date: -1 })
                .limit(30);

            let demandLevel = 'Medium';
            let percentage = 50; // Default sentiment

            if (history.length >= 2) {
                const latestPrice = history[0].price;
                const pastPrice = history[history.length - 1].price;

                const change = ((latestPrice - pastPrice) / pastPrice) * 100;

                // Logic: Rising prices often indicate High Demand (simplified economics)
                if (change > 5) {
                    demandLevel = 'High';
                    percentage = Math.min(95, 75 + change); // Cap at 95%
                } else if (change < -5) {
                    demandLevel = 'Low';
                    percentage = Math.max(10, 25 + change); // Floor at 10%
                } else {
                    demandLevel = 'Medium';
                    percentage = 50 + change; // Hover around 50%
                }
            } else {
                // Fallback if insufficient data
                const rnd = Math.random();
                if (rnd > 0.66) demandLevel = 'High';
                else if (rnd < 0.33) demandLevel = 'Low';
                percentage = Math.floor(Math.random() * 60) + 20;
            }

            demandForecasts.push({
                crop,
                demandLevel,
                percentage: Math.round(percentage),
                date: new Date()
            });
        }

        // 3. Batch Insert
        if (demandForecasts.length > 0) {
            await DemandForecast.insertMany(demandForecasts);
            console.log(`✅ Inserted ${demandForecasts.length} DemandForecast records based on price trends.`);
        } else {
            console.log('⚠️ No crops found to generate demand for.');
        }

        console.log('🏁 Smart Demand Seeding Complete!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedDemandSmart();
