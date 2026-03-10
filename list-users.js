const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}).select('email role -_id');
        users.forEach(u => console.log(`${u.email} -> ${u.role}`));
        await mongoose.connection.close();
    } catch (error) {
        console.error('ERROR:', error);
    }
}

listUsers();
