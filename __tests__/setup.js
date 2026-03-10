process.env.WEATHER_API_KEY = 'dummy_key';
const mongoose = require('mongoose'); 
process.env.WEATHER_API_KEY = 'dummy_key';
beforeAll(async () => { await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/agriwise_test'); }); 
process.env.WEATHER_API_KEY = 'dummy_key';
afterAll(async () => { await mongoose.connection.close(); });
