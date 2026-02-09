const fs = require('fs');
const mongoose = require('mongoose');
const MarketPrice = require('./models/MarketPrice');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/AgriWise';

mongoose.connect(uri)
    .then(async () => {
        const output = [];
        output.push('DIAGNOSTIC REPORT');

        try {
            const wheatCount = await MarketPrice.countDocuments({ crop: 'Wheat' });
            output.push(`Wheat Count: ${wheatCount}`);

            const applesCount = await MarketPrice.countDocuments({ crop: 'Apple' }); // Random check
            output.push(`Apple Count: ${applesCount}`);

            const wheatSamples = await MarketPrice.find({ crop: 'Wheat' }).limit(5);
            output.push('Wheat Samples: ' + JSON.stringify(wheatSamples, null, 2));

            const distinctCrops = await MarketPrice.distinct('crop');
            output.push(`Distinct Crops: ${distinctCrops.slice(0, 10).join(', ')}`);

        } catch (e) {
            output.push('Error: ' + e.message);
        }

        fs.writeFileSync('diagnostic_report.txt', output.join('\n'));
        console.log('Done');
        process.exit(0);
    });
