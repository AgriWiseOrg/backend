const axios = require('axios');

// Resource ID from search result (Current daily price)
// Note: These IDs often change. This is the one found in recent docs.
const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b'; // Public sample key
const FORMAT = 'json';

const url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=${FORMAT}&limit=5`;

console.log(`Pinging: ${url}`);

axios.get(url)
    .then(res => {
        console.log('✅ Success! Status:', res.status);
        console.log('Data Records:', res.data.records ? res.data.records.length : 0);
        if (res.data.records && res.data.records.length > 0) {
            console.log('Sample Record:', JSON.stringify(res.data.records[0], null, 2));
        } else {
            console.log('Full Response:', JSON.stringify(res.data, null, 2));
        }
    })
    .catch(err => {
        console.error('❌ Failed:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        }
    });
