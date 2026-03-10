const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/auth';

async function testAuth() {
    try {
        console.log('--- Testing Auth ---');
        const email = 'testuser_' + Date.now() + '@example.com';
        const password = 'password123';
        const role = 'farmer';

        // 1. Register
        console.log(`1. Registering user: ${email}`);
        try {
            const regRes = await axios.post(`${BASE_URL}/register`, { email, password, role });
            console.log('   Register Success:', regRes.status, regRes.data);
        } catch (e) {
            console.error('   Register Failed:', e.message);
            if (e.response) {
                console.error('   Response Status:', e.response.status);
                console.error('   Response Data:', JSON.stringify(e.response.data, null, 2));
            } else if (e.request) {
                console.error('   No Response Received (Server down or CORS?)');
            }
            return;
        }

        // 2. Login
        console.log(`2. Logging in user: ${email}`);
        try {
            const loginRes = await axios.post(`${BASE_URL}/login`, { email, password });
            console.log('   Login Success:', loginRes.status, loginRes.data);
        } catch (e) {
            console.error('   Login Failed:', e.message);
            if (e.response) {
                console.error('   Response Status:', e.response.status);
                console.error('   Response Data:', JSON.stringify(e.response.data, null, 2));
            } else if (e.request) {
                console.error('   No Response Received (Server down or CORS?)');
            }
        }

    } catch (err) {
        console.error('Global Error:', err);
    }
}

testAuth();
