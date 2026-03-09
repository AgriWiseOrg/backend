const axios = require('axios');

async function testPrediction() {
    try {
        const response = await axios.post('http://localhost:5001/api/predict-price', {
            product: 'Wheat',
            region: 'North India',
            month: 'August'
        });
        console.log('Prediction Response:', response.data);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function testForecast() {
    try {
        const response = await axios.get('http://localhost:5001/api/market/forecast-30-days?crop=Wheat');
        console.log('Forecast Response Data Length:', response.data.data.length);
        console.log('First Forecast:', response.data.data[0]);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function testHistory() {
    try {
        const response = await axios.get('http://localhost:5001/api/market/history?crop=Wheat');
        console.log('History Response Data Length:', response.data.data.length);
        console.log('First History:', response.data.data[0]);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function runTests() {
    console.log('--- Testing Prediction ---');
    await testPrediction();
    console.log('\n--- Testing Forecast ---');
    await testForecast();
    console.log('\n--- Testing History ---');
    await testHistory();
}

runTests();
