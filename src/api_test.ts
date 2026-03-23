import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
    console.log('🚀 Starting API Tests...\n');

    try {
        // 1. Register a test owner
        console.log('Step 1: Registering a test owner...');
        const ownerEmail = `testowner_${Date.now()}@example.com`;
        const ownerPhone = `9999999${Math.floor(Math.random() * 900) + 100}`;
        const password = 'password123';
        
        const ownerOtpRes = await axios.post(`${BASE_URL}/auth/send-register-otp`, {
            email: ownerEmail,
            phone: ownerPhone,
            name: 'Test Owner'
        });
        const ownerOtp = ownerOtpRes.data.data.devOtp;

        const ownerRegRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: 'Test Owner',
            email: ownerEmail,
            password,
            phone: ownerPhone,
            role: 'owner',
            otp: ownerOtp
        });
        const ownerToken = ownerRegRes.data.data.token;
        const ownerHeader = { headers: { Authorization: `Bearer ${ownerToken}` } };
        console.log('✅ Owner registered!\n');

        // 2. Register a test student
        console.log('Step 2: Registering a test student...');
        const studentEmail = `teststudent_${Date.now()}@example.com`;
        const studentPhone = `8888888${Math.floor(Math.random() * 900) + 100}`;
        
        const studentOtpRes = await axios.post(`${BASE_URL}/auth/send-register-otp`, {
            email: studentEmail,
            phone: studentPhone,
            name: 'Test Student'
        });
        const studentOtp = studentOtpRes.data.data.devOtp;

        const studentRegRes = await axios.post(`${BASE_URL}/auth/register`, {
            name: 'Test Student',
            email: studentEmail,
            password,
            phone: studentPhone,
            role: 'student',
            otp: studentOtp
        });
        const studentToken = studentRegRes.data.data.token;
        const studentHeader = { headers: { Authorization: `Bearer ${studentToken}` } };
        console.log('✅ Student registered!\n');

        // 3. Create a Room (as owner)
        console.log('Step 3: Creating a room...');
        const roomRes = await axios.post(`${BASE_URL}/rooms`, {
            title: 'Test Room',
            description: 'A room for testing.',
            price: 5000,
            deposit: 10000,
            location: {
                address: '123 Test St',
                city: 'Test City',
                state: 'Test State',
                pincode: '123456'
            },
            roomType: 'single',
            facilities: ['WiFi'],
            images: ['https://via.placeholder.com/150']
        }, ownerHeader);
        const roomId = roomRes.data.data._id || roomRes.data.data.room?._id;
        console.log(`✅ Room created: ${roomId}\n`);

        // 4. Create a Booking (as student)
        console.log('Step 4: Creating a booking...');
        const bookingRes = await axios.post(`${BASE_URL}/bookings`, {
            bookingType: 'room',
            roomId: roomId,
            startDate: new Object(new Date().toISOString()),
            totalAmount: 5000
        }, studentHeader);
        console.log('✅ Booking created!\n');

        // 5. Fetch Student Bookings
        console.log('Step 5: Fetching student bookings...');
        const myBookingsRes = await axios.get(`${BASE_URL}/bookings/my-bookings`, studentHeader);
        console.log(`✅ Found ${myBookingsRes.data.data.length} bookings for student.\n`);

        console.log('🎉 All integrity tests passed successfully!');

    } catch (error: any) {
        console.error('❌ Test failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
        process.exit(1);
    }
}

runTests();
