// Native fetch is available in Node.js 18+


const testPrediction = async () => {
    const url = 'http://localhost:5001/api/predict-price';
    const payload = {
        product: 'Wheat',
        region: 'North India',
        month: 'November'
    };

    try {
        console.log('Sending request to:', url);
        console.log('Payload:', payload);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (data.predictedPrice && data.confidence) {
            console.log('✅ AI Prediction API Test Passed');
        } else {
            console.log('❌ AI Prediction API Missing Data');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
};

testPrediction();
