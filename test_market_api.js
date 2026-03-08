const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/market';

const testHybridAPI = async () => {
    console.log('🧪 Testing Market APIs (Hybrid Mode)...');

    try {
        // 1. Test Prices (External API)
        console.log('\n--- Testing /prices (Should be External) ---');
        const pricesRes = await axios.get(`${BASE_URL}/prices`);
        console.log(`✅ Fetched ${pricesRes.data.length} live records`);
        if (pricesRes.data.length > 0) console.log('Sample:', pricesRes.data[0]);

        // 2. Test History (MongoDB)
        console.log('\n--- Testing /history (Should be DB) ---');
        const historyRes = await axios.get(`${BASE_URL}/history?crop=Wheat`);
        console.log(`✅ Fetched history. Points: ${historyRes.data.data.length}`);

        // 3. Test Demand (MongoDB)
        console.log('\n--- Testing /demand (Should be DB) ---');
        const demandRes = await axios.get(`${BASE_URL}/demand`);
        console.log(`✅ Fetched ${demandRes.data.length} forecasts`);

    } catch (error) {
        console.error('❌ API Test Failed:', error.message);
    }
};

testHybridAPI();
