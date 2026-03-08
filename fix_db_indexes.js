const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/AgriWise';

async function fixIndexes() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const indexes = await User.collection.getIndexes();
        console.log('Current Indexes:', indexes);

        // Drop all indexes except _id (Mongoose will recreate defined ones)
        // Or specifically drop the problematic one if we know the name
        // Typically it is 'phoneNumber_1' if the field was phoneNumber

        // Let's just drop them all to be safe and let Mongoose rebuild sync
        // console.log('Dropping all indexes...');
        // await User.collection.dropIndexes();

        // Safer: Drop specific index if it exists
        if (indexes.phoneNumber_1) {
            console.log('Dropping phoneNumber_1 index...');
            await User.collection.dropIndex('phoneNumber_1');
            console.log('Dropped phoneNumber_1');
        } else {
            console.log('phoneNumber_1 index not found.');
            // Check for other potential offenders or just drop non-id indexes
            for (const indexName in indexes) {
                if (indexName !== '_id_') {
                    // Check if index key contains 'phoneNumber'
                    if (JSON.stringify(indexes[indexName]).includes('phoneNumber')) {
                        console.log(`Dropping index ${indexName}...`);
                        await User.collection.dropIndex(indexName);
                    }
                }
            }
        }

        console.log('Done.');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixIndexes();
