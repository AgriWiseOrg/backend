const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const MarketPrice = require('../models/MarketPrice');
const PredictionModel = require('../models/PredictionModel');
const PredictionEngine = require('../utils/predictionEngine');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

const seedModelData = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/AgriWise';
        console.log(`🔗 Connecting to ${uri}...`);
        await mongoose.connect(uri);
        console.log('🍃 Connected to MongoDB');

        // 1. Read CSV for Current Prices (Anchor)
        const csvPath = path.join(__dirname, '../data/commodity_price.csv');
        if (!fs.existsSync(csvPath)) {
            console.error(`❌ CSV file not found at ${csvPath}`);
            process.exit(1);
        }

        const lines = fs.readFileSync(csvPath, 'utf8').split('\n');
        const anchorPrices = []; // { crop, market, state, price }

        // Processing CSV
        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i].trim());
            if (cols.length < 10) continue;

            const crop = cols[3].trim();
            const price = parseFloat(cols[9]);

            if (crop && !isNaN(price) && price > 0) {
                anchorPrices.push({
                    crop,
                    market: cols[2].trim(),
                    state: cols[0].trim(),
                    price
                });
            }
        }

        console.log(`📍 Found ${anchorPrices.length} anchor prices from CSV.`);

        // 2. Clear Old Data
        await MarketPrice.deleteMany({});
        await PredictionModel.deleteMany({});
        console.log('🗑️  Cleared old MarketPrice and PredictionModel records.');

        // 3. Generate History using AI Model Logic
        const newRecords = [];
        const MONTHS_BACK = 6;
        const currentDate = new Date();

        console.log('🔄 Generating model-consistent history...');

        for (const anchor of anchorPrices) {
            // Add CURRENT price (Today)
            newRecords.push({
                ...anchor,
                date: currentDate,
                trend: 'stable' // Default for today
            });

            // Back-calculate history
            for (let m = 1; m <= MONTHS_BACK; m++) {
                const historyDate = new Date();
                historyDate.setMonth(currentDate.getMonth() - m);
                historyDate.setDate(1); // 1st of that month

                const historyPrice = PredictionEngine.backcastPrice(anchor.price, historyDate, currentDate);

                newRecords.push({
                    crop: anchor.crop,
                    market: anchor.market,
                    state: anchor.state,
                    price: historyPrice, // Using generated price
                    date: historyDate,
                    trend: historyPrice < anchor.price ? 'up' : 'down' // Trend relative to NEXT point (which is more recent)
                });
            }
        }

        // 4. Batch Insert
        const chunkSize = 1000;
        for (let i = 0; i < newRecords.length; i += chunkSize) {
            const chunk = newRecords.slice(i, i + chunkSize);
            await MarketPrice.insertMany(chunk);
            console.log(`✅ Inserted ${Math.min(i + chunkSize, newRecords.length)}/${newRecords.length} records`);
        }

        console.log('🏁 Model-based seeding complete!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedModelData();
