const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Product = require('./models/Products');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB...");
    const res = await Product.deleteMany({
        $or: [
            { name: { $regex: /vatakara/i } },
            { name: { $regex: /^gg$/i } },
            { crop: { $regex: /vatakara/i } },
            { crop: { $regex: /^gg$/i } }
        ]
    });
    console.log("Successfully deleted dummy products. Count:", res.deletedCount);
    mongoose.disconnect();
}).catch(err => {
    console.error("Error:", err);
    mongoose.disconnect();
});
