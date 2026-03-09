const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const parseCSV = require('../utils/csvParser');
const MarketPrice = require('../models/MarketPrice');

/**
 * Seeds the MarketPrice collection with 6 months of historical data
 * for all crops found in the commodity_price.csv file
 */
async function seedMarketData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🍃 MongoDB Connected');

        // Parse CSV file
        const csvPath = path.join(__dirname, '..', 'data', 'commodity_price.csv');
        console.log('📄 Reading CSV file...');
        const records = await parseCSV(csvPath);
        console.log(`✅ Parsed ${records.length} records from CSV`);

        // Extract unique crops and their average modal prices
        const cropPriceMap = new Map();

        records.forEach(record => {
            const crop = record.Commodity;
            const modalPrice = parseFloat(record.Modal_x0020_Price);

            if (crop && !isNaN(modalPrice) && modalPrice > 0) {
                if (!cropPriceMap.has(crop)) {
                    cropPriceMap.set(crop, []);
                }
                cropPriceMap.get(crop).push(modalPrice);
            }
        });

        console.log(`📊 Found ${cropPriceMap.size} unique crops`);

        // Clear existing data
        await MarketPrice.deleteMany({});
        console.log('🗑️  Cleared existing market price data');

        // Generate 6 months of historical data for each crop
        const historicalData = [];
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        cropPriceMap.forEach((prices, crop) => {
            // Calculate average modal price for this crop
            const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

            // Generate data points (one per week for 6 months = ~26 data points)
            const weeksInSixMonths = 26;

            for (let i = 0; i < weeksInSixMonths; i++) {
                const date = new Date(sixMonthsAgo);
                date.setDate(date.getDate() + (i * 7)); // Add weeks

                // Add realistic variation with seasonal pattern
                const seasonalFactor = 1 + (0.1 * Math.sin((i / weeksInSixMonths) * Math.PI * 2));
                const randomVariation = 0.9 + (Math.random() * 0.2); // ±10% variation
                const price = Math.round(avgPrice * seasonalFactor * randomVariation);

                historicalData.push({
                    crop,
                    price,
                    date,
                    market: 'Historical Data',
                    state: 'India'
                });
            }
        });

        // Insert all historical data
        await MarketPrice.insertMany(historicalData);
        console.log(`✅ Seeded ${historicalData.length} historical price records`);
        console.log(`📈 ${cropPriceMap.size} crops now have 6 months of historical data`);

        // Display sample crops
        const sampleCrops = Array.from(cropPriceMap.keys()).slice(0, 10);
        console.log('\n📋 Sample crops seeded:');
        sampleCrops.forEach(crop => console.log(`   - ${crop}`));
        if (cropPriceMap.size > 10) {
            console.log(`   ... and ${cropPriceMap.size - 10} more`);
        }

        await mongoose.disconnect();
        console.log('\n🎉 Seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

// Run the seeding function
seedMarketData();
