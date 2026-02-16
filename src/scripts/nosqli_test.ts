import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

async function testNoSQLi() {
    console.log('--- Testing NoSQL Injection on /api/auth/login ---');
    try {
        const response = await api.post('/auth/login', {
            emailOrPhone: { "$gt": "" },
            password: { "$gt": "" }
        });
        console.log('Result:', response.data);
        if (response.data.success) {
            console.log('VULNERABLE: Successfully logged in using NoSQL injection!');
        } else {
            console.log('SAFE: Login failed as expected.');
        }
    } catch (error: any) {
        console.log('SAFE: Request failed or blocked by middleware.', error.response?.data || error.message);
    }
}

testNoSQLi();
