const mongoose = require('mongoose');
const PredictionModel = require('./models/PredictionModel');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/AgriWise';

mongoose.connect(uri)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        const models = await PredictionModel.find({});
        console.log('\n📊 Saved Prediction Models:');
        console.log(JSON.stringify(models, null, 2));

        if (models.length === 0) {
            console.log('⚠️ No models found. Try running a prediction test first.');
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });

    