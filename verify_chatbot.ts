import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testChatbot() {
    const queries = [
        'Hello',
        'What is on the menu?',
        'Laundry timings?',
        'WiFi password',
        'Contact warden',
        'Gym rules',
        'Guest policy',
        'How to pay rent?',
        'Random question'
    ];

    console.log('--- Starting Chatbot Verification ---');

    // 1. Register/Login a test user
    const testUser = {
        name: 'ChatBotTester',
        email: `chattest_${Date.now()}@test.com`,
        password: 'password123',
        phone: `${Date.now().toString().slice(-10)}`,
        role: 'student'
    };

    let token = '';

    try {
        console.log(`Creating test user: ${testUser.email}`);
        const authRes = await axios.post(`${API_URL}/auth/register`, testUser);
        token = authRes.data.token;
        console.log('User created and logged in.');
    } catch (error: any) {
        console.error('Auth failed:', error.message);
        if (error.response) console.error(error.response.data);
        return;
    }

    // 2. Test Chatbot
    for (const query of queries) {
        try {
            const response = await axios.post(
                `${API_URL}/chat/send`, // Correct endpoint
                { message: query },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            console.log(`\nQ: ${query}`);
            console.log(`A: ${response.data.reply}`);
        } catch (error: any) {
            console.error(`Failed to get response for "${query}":`, error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                // console.error('Data:', error.response.data);
            }
        }
    }
    console.log('\n--- Verification Complete ---');
}

testChatbot();
