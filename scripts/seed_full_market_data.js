const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MarketPrice = require('../models/MarketPrice');
const DemandForecast = require('../models/DemandForecast');
const PredictionModel = require('../models/PredictionModel');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🍃 MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

const CSV_FILE = path.join(__dirname, '../data/commodity_price.csv');

const parseDate = (dateStr) => {
    // Format: dd/mm/yyyy
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
};

const seedData = async () => {
    try {
        console.log('🗑️ Clearing existing market data...');
        await MarketPrice.deleteMany({});
        await DemandForecast.deleteMany({});
        await PredictionModel.deleteMany({}); // Clear old models to force retraining

        console.log('🌱 Reading CSV and seeding data...');
        const marketPrices = [];
        const cropsSet = new Set();
        const batchSize = 1000; // Insert in batches to avoid memory issues

        const cropDetails = new Map(); // Store details for history generation

        const stream = fs.createReadStream(CSV_FILE).pipe(csv());

        for await (const row of stream) {
            if (!row.Commodity || !row.Modal_x0020_Price || !row.Arrival_Date) continue;

            const price = parseFloat(row.Modal_x0020_Price);
            if (isNaN(price)) continue;

            const date = parseDate(row.Arrival_Date);

            // Clean commodity name: remove quotes, trim
            const cropName = row.Commodity.replace(/"/g, '').trim();

            cropsSet.add(cropName);

            // Keep the most recent/relevant record for this crop to base history on
            if (!cropDetails.has(cropName)) {
                cropDetails.set(cropName, {
                    market: row.Market,
                    state: row.State,
                    district: row.District,
                    price: price
                });
            }
        }

        // Now generate history for ALL crops
        console.log(`⏳ Generating 6 months history for ${cropsSet.size} crops...`);
        const historyBatch = [];
        const generateHistory = (crop, basePrice, market, state, district) => {
            const history = [];
            const today = new Date();

            for (let i = 180; i >= 0; i--) {
                const date = new Date();
                date.setDate(today.getDate() - i);

                // Random daily fluctuation (+/- 5%)
                const variance = 1 + (Math.random() * 0.1 - 0.05);
                // Slight seasonal trend (sine wave)
                const seasonality = 1 + Math.sin(i / 30) * 0.05;

                let price = basePrice * variance * seasonality;
                price = Math.round(price);

                history.push({
                    crop,
                    market,
                    state,
                    district,
                    price,
                    date,
                    // The 'trend' field is not part of the MarketPrice schema, removing it.
                    // trend: Math.random() > 0.5 ? 'up' : 'down'
                });
            }
            return history;
        };

        for (const crop of cropsSet) {
            const repData = cropDetails.get(crop); // Corrected from cropRepresentativeData
            if (repData) {
                const historicalPrices = generateHistory(
                    crop,
                    repData.price,
                    repData.market,
                    repData.state,
                    repData.district
                );
                historyBatch.push(...historicalPrices);

                if (historyBatch.length >= batchSize) {
                    await MarketPrice.insertMany(historyBatch);
                    historyBatch.length = 0;
                    process.stdout.write('H'); // Indicate history batch insertion
                }
            }
        }

        // Insert any remaining historical data
        if (historyBatch.length > 0) {
            await MarketPrice.insertMany(historyBatch);
        }
        console.log('\n✅ Historical Market Prices Generated!');


        // Generate Mock Demand Forecaset & Trends based on crops
        console.log('📈 Generating Demand Forecasts...');
        const demandForecasts = [];

        cropsSet.forEach(crop => {
            // Random demand logic
            const randomVal = Math.random();
            let demandLevel = 'Medium';
            if (randomVal > 0.66) demandLevel = 'High';
            else if (randomVal < 0.33) demandLevel = 'Low';

            demandForecasts.push({
                crop: crop,
                demandLevel: demandLevel,
                percentage: Math.floor(Math.random() * 100), // 0-100%
                date: new Date()
            });
        });

        await DemandForecast.insertMany(demandForecasts);
        console.log('✅ Demand Forecasts Seeded!');

        console.log('🎉 Seeding Complete. Exiting...');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

seedData();
