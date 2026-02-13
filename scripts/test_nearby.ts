
import axios from 'axios';
import mongoose from 'mongoose';
import User from '../src/models/User';
import { RoommateProfile } from '../src/models/RoommateProfile';
import Service from '../src/models/Service';
import MessPlan from '../src/models/MessPlan';
import Room from '../src/models/Room';
import jwt from 'jsonwebtoken';

const MONGODB_URI = 'mongodb+srv://chaitanya_room:chaitanya123@cluster0.w0i85.mongodb.net/roomnmeal?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = 'your_jwt_secret_key_here'; // Replace with actual secret or env var

const API_URL = 'http://localhost:5000/api';

async function connectDB() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
}

async function createTestUser() {
    const email = `test_nearby_${Date.now()}@test.com`;
    const password = 'password123';
    // Create user logic here or just assume we have one. 
    // Easier to just use a mock token if we can, but we need a real user in DB for relationships.

    // Check if user exists or create
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({
            name: 'Test Nearby User',
            email,
            password,
            role: 'student',
            phone: '1234567890'
        });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    return { user, token };
}

async function testNearbyFeatures() {
    try {
        await connectDB();
        const { user, token } = await createTestUser();
        const headers = { Authorization: `Bearer ${token}` };

        console.log(`Testing with User ID: ${user._id}`);
        // 1. Create Profile with City
        const city = 'TestCity_' + Date.now();
        console.log(`Target City: ${city}`);

        await axios.post(`${API_URL}/roommate-profiles`, {
            college: 'Test College',
            city: city,
            budget: 5000,
            gender: 'Male',
            habits: {},
            contactHidden: false
        }, { headers });
        console.log('Profile created with city');

        // 2. Create Service in City
        const service = await Service.create({
            ownerId: user._id,
            name: 'Test Service Nearby',
            description: 'Test Desc',
            price: 100,
            unit: 'hr',
            icon: 'cleaning',
            category: 'cleaning',
            location: {
                address: '123 St',
                city: city, // Matches
                state: 'TestState',
                pincode: '123456'
            },
            isActive: true,
            images: ['http://example.com/image.jpg'] // Added mocked image
        });
        console.log('Service created in city');

        // 3. Create Mess in City
        const mess = await MessPlan.create({
            providerId: user._id,
            providerName: 'Test Mess Nearby',
            description: 'Desc',
            monthlyPrice: 2000,
            messType: 'veg',
            menu: {
                monday: { breakfast: 'a', lunch: 'b', dinner: 'c' },
                tuesday: { breakfast: 'a', lunch: 'b', dinner: 'c' },
                wednesday: { breakfast: 'a', lunch: 'b', dinner: 'c' },
                thursday: { breakfast: 'a', lunch: 'b', dinner: 'c' },
                friday: { breakfast: 'a', lunch: 'b', dinner: 'c' },
                saturday: { breakfast: 'a', lunch: 'b', dinner: 'c' },
                sunday: { breakfast: 'a', lunch: 'b', dinner: 'c' }
            },
            mealTimings: { breakfast: '8-9', lunch: '1-2', dinner: '8-9' },
            location: {
                address: '123 St',
                city: city,
                state: 'TestState',
                pincode: '123456',
                coordinates: { lat: 0, lng: 0 }
            },
            contactNumber: '1234567890',
            isApproved: true,
            isActive: true,
            images: ['http://example.com/mess.jpg'] // Added mocked image
        });
        console.log('Mess created in city');

        // 4. Test APIs
        console.log('--- Verifying APIs ---');

        // Services
        const serviceRes = await axios.get(`${API_URL}/services?city=${city}`);
        const foundService = serviceRes.data.data.find((s: any) => s._id.toString() === service._id.toString());
        console.log(`Service Search: ${foundService ? 'PASS' : 'FAIL'}`);

        // Messes
        // Assuming mess route is /mess
        const messRes = await axios.get(`${API_URL}/mess?city=${city}`);
        const foundMess = messRes.data.data.find((m: any) => m._id.toString() === mess._id.toString());
        console.log(`Mess Search: ${foundMess ? 'PASS' : 'FAIL'}`);

        // 5. Cleanup
        await RoommateProfile.deleteOne({ userId: user._id });
        await Service.findByIdAndDelete(service._id);
        await MessPlan.findByIdAndDelete(mess._id);
        await User.findByIdAndDelete(user._id); // Optional

    } catch (error: any) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testNearbyFeatures();
