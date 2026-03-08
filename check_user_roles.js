const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String }));
        const users = await User.find({}, 'email role');
        console.log('--- User Roles in DB ---');
        users.forEach(u => console.log(`${u.email}: [${u.role}]`));
        console.log('------------------------');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
