const axios = require('axios');

async function testWeatherNoTimezone() {
    const lat = 28.6139;
    const lon = 77.2090;
    // URL from FrontPage.jsx
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`;

    try {
        const response = await axios.get(url);
        console.log('Result for New Delhi (no timezone):', response.data.current.temperature_2m);
    } catch (err) {
        console.error(err);
    }
}

testWeatherNoTimezone();
