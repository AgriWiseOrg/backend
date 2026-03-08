const testForecast = async () => {
    const crop = 'Wheat';
    const url = `http://localhost:5001/api/market/forecast-30-days?crop=${crop}`;

    try {
        console.log(`Fetching forecast for ${crop}...`);
        const response = await fetch(url);
        const data = await response.json();

        if (response.status === 200) {
            console.log('✅ Status 200 OK');
            if (data.data && Array.isArray(data.data)) {
                console.log(`✅ Received ${data.data.length} data points.`);
                if (data.data.length > 0) {
                    console.log('Sample Data Point:', data.data[0]);
                    console.log('Last Data Point:', data.data[data.data.length - 1]);
                } else {
                    console.warn('⚠️ valid response but empty data array (maybe no model/history?)');
                }
            } else {
                console.error('❌ Response format incorrect:', data);
            }
        } else {
            console.error(`❌ Request failed with status ${response.status}`, data);
        }

    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
};

testForecast();
