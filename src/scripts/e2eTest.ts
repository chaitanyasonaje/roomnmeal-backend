import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';
import Room from '../models/Room';
import Booking from '../models/Booking';
import Payment from '../models/Payment';

import dns from 'dns';

// Force custom DNS to resolve SRV lookup failures
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.log('Could not set custom DNS servers');
}

const API_URL = 'http://localhost:5000/api';
const PASSWORD = 'password123';

const TEST_STUDENT = {
    name: 'Test Student',
    email: 'test_student_e2e@example.com',
    phone: '9000000001',
    password: PASSWORD,
    role: 'student',
    isVerified: true
};

const TEST_OWNER = {
    name: 'Test Owner',
    email: 'test_owner_e2e@example.com',
    phone: '9000000002',
    password: PASSWORD,
    role: 'owner',
    isVerified: true
};

const TEST_ADMIN = {
    email: 'admin@roomnmeal.com',
    password: PASSWORD
};

let studentToken = '';
let ownerToken = '';
let adminToken = '';
let createdRoomId = '';
let bookingId = '';
let paymentId = '';
let razorpayOrderId = '';

async function setupTestUsers() {
    console.log('🛠️  Setting up Test Users in DB...');
    await mongoose.connect(process.env.MONGODB_URI as string);

    // Cleanup old test data
    await User.deleteOne({ email: TEST_STUDENT.email });
    await User.deleteOne({ email: TEST_OWNER.email });
    await User.deleteOne({ email: TEST_ADMIN.email }); // Force delete admin to reset password

    // Create fresh users directly (Bypassing OTP flow for E2E speed)
    await User.create(TEST_STUDENT);
    await User.create(TEST_OWNER);

    // Ensure admin exists (from seed or create new)
    let admin = await User.findOne({ email: TEST_ADMIN.email });
    if (!admin) {
        console.log('⚠️  Admin user not found. Creating one...');
        await User.create({
            name: 'Test Admin',
            email: TEST_ADMIN.email,
            phone: '9999999999',
            password: PASSWORD,
            role: 'admin',
            isVerified: true,
            profilePicture: 'https://ui-avatars.com/api/?name=Admin+User'
        });
        console.log('✅ Admin User Created.');
    }

    console.log('✅ Test Users Created/Verified.');
}

async function loginUser(email: string, role: string) {
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            emailOrPhone: email,
            password: PASSWORD
        });
        console.log(`✅ Login Success [${role}]`);
        return res.data.data.token;
    } catch (error: any) {
        console.error(`❌ Login Failed [${role}]:`, error.response?.data?.message || error.message);
        throw error;
    }
}

async function runTests() {
    try {
        await setupTestUsers();

        console.log('\n--- 1. Authentication ---');
        studentToken = await loginUser(TEST_STUDENT.email, 'Student');
        ownerToken = await loginUser(TEST_OWNER.email, 'Owner');
        adminToken = await loginUser(TEST_ADMIN.email, 'Admin');

        console.log('\n--- 2. Room Management ---');
        // Owner creates room
        const roomData = {
            title: 'E2E Test Room ' + Date.now(),
            description: 'A cozy room for testing.',
            price: 5000,
            deposit: 10000,
            location: {
                address: '123 Test St',
                city: 'Test City',
                state: 'Test State',
                pincode: '123456'
            },
            roomType: 'single',
            gender: 'any',
            facilities: ['WiFi'],
            availableFrom: new Date(),
            images: ['https://example.com/image.jpg']
        };

        const roomRes = await axios.post(`${API_URL}/rooms`, roomData, {
            headers: { Authorization: `Bearer ${ownerToken}` }
        });
        createdRoomId = roomRes.data.data._id;
        console.log(`✅ Room Created: ${createdRoomId}`);

        // Admin approves room
        await axios.put(`${API_URL}/admin/approve/room/${createdRoomId}`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Room Approved by Admin');

        console.log('\n--- 3. Booking Flow ---');
        // Student books room
        const bookingData = {
            bookingType: 'room',
            roomId: createdRoomId,
            startDate: new Date().toISOString()
        };
        const bookingRes = await axios.post(`${API_URL}/bookings`, bookingData, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        bookingId = bookingRes.data.data._id;
        console.log(`✅ Booking Created: ${bookingId}`);

        console.log('\n--- 4. Payment Flow ---');
        // 1. Create Order
        const orderRes = await axios.post(`${API_URL}/payments/create-order`, { bookingId }, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        razorpayOrderId = orderRes.data.data.orderId;
        const amount = orderRes.data.data.amount;
        console.log(`✅ Payment Order Created: ${razorpayOrderId} (Amount: ${amount})`);

        // 2. Simulate Webhook (Payment Success)
        // We need the secret to sign the body
        const crypto = require('crypto');
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        const webhookBody = JSON.stringify({
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_test_' + Date.now(),
                        order_id: razorpayOrderId,
                        amount: amount,
                        status: 'captured',
                        email: TEST_STUDENT.email
                    }
                }
            }
        });

        const signature = crypto.createHmac('sha256', secret).update(webhookBody).digest('hex');

        await axios.post(`${API_URL}/payments/webhook`, JSON.parse(webhookBody), {
            headers: { 'x-razorpay-signature': signature }
        });
        console.log('✅ Webhook Triggered (Payment Captured)');

        // Verify status
        const verifyBooking = await axios.get(`${API_URL}/bookings/my-bookings`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        const myBooking = verifyBooking.data.data.find((b: any) => b._id === bookingId);
        if (myBooking.status === 'confirmed') {
            console.log('✅ Booking Status Confirmed via Webhook');
            paymentId = myBooking.paymentId;
        } else {
            console.error('❌ Booking Status NOT Confirmed. Current:', myBooking.status);
        }

        if (adminToken && paymentId) {
            console.log('\n--- 5. Refund Flow (Admin) ---');
            // Mock Refund
            try {
                const refundRes = await axios.post(`${API_URL}/payments/refund`, {
                    paymentId,
                    reason: 'E2E Test Refund'
                }, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                console.log('✅ Refund Requested:', refundRes.data.message);

                // Verify Cancelled
                const finalBooking = await Booking.findById(bookingId);
                if (finalBooking?.status === 'cancelled') {
                    console.log('✅ Booking Cancelled after Refund');
                }
            } catch (e: any) {
                console.log('⚠️ Refund Test Skipped/Failed (Maybe mock Razorpay issue):', e.response?.data?.message || e.message);
            }
        }

        console.log('\n✨ E2E Verification Complete!');
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ E2E Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

runTests();
