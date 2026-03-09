const axios = require('axios');

async function testWeather() {
    const lat = 28.6139;
    const lon = 77.2090;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;

    try {
        const response = await axios.get(url);
        console.log('Current Temp:', response.data.current.temperature_2m);
        console.log('Daily Max:', response.data.daily.temperature_2m_max[0]);
        console.log('Daily Min:', response.data.daily.temperature_2m_min[0]);
    } catch (err) {
        console.error(err);
    }
}

testWeather();
