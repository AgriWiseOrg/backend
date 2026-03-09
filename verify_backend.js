const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function verifyBackend() {
    try {
        console.log('--- Starting Verification ---');

        // 1. Register/Login User
        const phone = '9999999999';
        let user;
        try {
            console.log('Attempting login...');
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, { phoneNumber: phone });
            user = loginRes.data.user;
            console.log('Logged in existing user:', user._id);
        } catch (e) {
            if (e.response && e.response.status === 404) {
                console.log('User not found, registering...');
                const regRes = await axios.post(`${BASE_URL}/auth/register`, { phoneNumber: phone });
                user = regRes.data.user;
                console.log('Registered new user:', user._id);
            } else {
                throw e;
            }
        }

        // 2. Create Product
        console.log('Creating product...');
        const productData = {
            name: 'Test Wheat',
            price: 100,
            description: 'Test Description',
            imageUrl: 'http://example.com/image.jpg',
            farmerId: user._id
        };
        const createRes = await axios.post(`${BASE_URL}/products`, productData);
        const product = createRes.data;
        console.log('Product created:', product._id, product.name);

        // 3. Get Products
        console.log('Fetching products...');
        const getRes = await axios.get(`${BASE_URL}/products/${user._id}`);
        const products = getRes.data;
        console.log(`Fetched ${products.length} products`);
        const found = products.find(p => p._id === product._id);
        if (!found) throw new Error('Created product not found in list!');

        // 4. Update Product
        console.log('Updating product...');
        const updateRes = await axios.put(`${BASE_URL}/products/${product._id}`, {
            name: 'Updated Wheat',
            price: 150,
            description: 'Updated Description',
            imageUrl: 'http://example.com/updated.jpg'
        });
        console.log('Product updated:', updateRes.data.name, updateRes.data.price);
        if (updateRes.data.name !== 'Updated Wheat') throw new Error('Update failed!');

        // 5. Delete Product
        console.log('Deleting product...');
        await axios.delete(`${BASE_URL}/products/${product._id}`);
        console.log('Product deleted');

        // Verify deletion
        const verifyGet = await axios.get(`${BASE_URL}/products/${user._id}`);
        const deletedFound = verifyGet.data.find(p => p._id === product._id);
        if (deletedFound) throw new Error('Product still exists after deletion!');

        console.log('--- Verification Successful! ---');
    } catch (error) {
        console.error('VERIFICATION FAILED:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

verifyBackend();
