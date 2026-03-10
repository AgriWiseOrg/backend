const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function checkUser(email) {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email });
        console.log('USER DATA:', JSON.stringify(user, null, 2));
        await mongoose.connection.close();
    } catch (error) {
        console.error('ERROR:', error);
    }
}

const emailToCheck = process.argv[2] || 'buyer@example.com';
checkUser(emailToCheck);
