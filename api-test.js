const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testAPI = async () => {
    console.log('🚀 Starting API Verification...\n');

    // 1. Health Check (if exists) or just generic check
    try {
        console.log('1️⃣  Checking Server Connectivity...');
        // We'll try hitting a non-existent endpoint to seeing if we get a 404 from Express (meaning server is up)
        // Or if there is a health endpoint.
        await axios.get(`${API_URL}/health`).catch(err => {
            if (err.code === 'ECONNREFUSED') {
                throw new Error('Server is NOT running. Connection refused.');
            }
        });
        console.log('✅ Server connection established.\n');
    } catch (error) {
        console.error('❌ Server is unreachable:', error.message);
        return;
    }

    // 2. Authentication Flow
    let authToken = null;
    const testUser = {
        name: 'API Tester',
        email: `test_${Date.now()}@example.com`,
        password: 'password123',
        // Generate valid 10 digit phone: 9 + 9 random digits
        phone: '9' + Math.floor(100000000 + Math.random() * 900000000).toString(),
        role: 'student'
    };

    console.log('2️⃣  Testing Authentication...');
    console.log(`   User: ${testUser.name}, ${testUser.email}, ${testUser.phone}`);

    // Register
    try {
        process.stdout.write(`   - Registering user... `);
        const regRes = await axios.post(`${API_URL}/auth/register`, testUser);
        if (regRes.data.success) {
            console.log('✅ Success');
            authToken = regRes.data.data.token;
        } else {
            console.log('❌ Failed:', regRes.data.message);
        }
    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
    }

    // Login
    try {
        process.stdout.write(`   - Logging in... `);
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            emailOrPhone: testUser.email,
            password: testUser.password
        });
        if (loginRes.data.success) {
            console.log('✅ Success');
            authToken = loginRes.data.data.token;
        } else {
            console.log('❌ Failed:', loginRes.data.message);
        }
    } catch (error) {
        console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    if (!authToken) {
        console.error('\n⚠️  Stopping: Cannot proceed without auth token.');
        return;
    }

    // Profile
    try {
        process.stdout.write(`   - Fetching Profile... `);
        const profileRes = await axios.get(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (profileRes.data.success) {
            console.log('✅ Success');
        } else {
            console.log('❌ Failed:', profileRes.data.message);
        }
    } catch (error) {
        console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    console.log('\n3️⃣  Testing Data Endpoints...');

    // Rooms
    try {
        process.stdout.write(`   - Fetching Rooms... `);
        const roomsRes = await axios.get(`${API_URL}/rooms`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log(roomsRes.status === 200 ? '✅ Success' : '❌ Failed');
    } catch (error) {
        console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Mess
    try {
        process.stdout.write(`   - Fetching Mess Plans... `);
        const messRes = await axios.get(`${API_URL}/mess`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log(messRes.status === 200 ? '✅ Success' : '❌ Failed');
    } catch (error) {
        console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    console.log('\n🚀 API Verification Completed.');
};

testAPI();
