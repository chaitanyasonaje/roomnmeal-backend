
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fakerEN_IN as faker } from '@faker-js/faker';

dotenv.config();

// Import models
import User from './models/User';
import Room from './models/Room';
import MessPlan from './models/MessPlan';
import Service from './models/Service';
import Booking from './models/Booking';

const CITIES = [
    { name: 'Shirpur', state: 'Maharashtra', lat: 21.35, lng: 74.88, pincode: '425405' },
    { name: 'Pune', state: 'Maharashtra', lat: 18.52, lng: 73.85, pincode: '411001' },
    { name: 'Mumbai', state: 'Maharashtra', lat: 19.07, lng: 72.87, pincode: '400001' },
    { name: 'Nashik', state: 'Maharashtra', lat: 19.99, lng: 73.78, pincode: '422001' },
];

const AMENITIES = ['WiFi', 'AC', 'Attached Bathroom', 'Geyser', 'Power Backup', 'Study Table', 'Cupboard', 'Washing Machine', 'TV', 'Parking'];
const MEALS = ['Dal Fry', 'Jeera Rice', 'Paneer Butter Masala', 'Aloo Gobi', 'Chapati', 'Salad', 'Papad', 'Chicken Curry', 'Egg Curry', 'Biryani'];
const SERVICE_TYPES = [
    { name: 'Laundry Service', icon: 'washing-machine', unit: 'Per Kg' },
    { name: 'Tiffin Service', icon: 'food', unit: 'Per Meal' },
    { name: 'Room Cleaning', icon: 'broom', unit: 'Per Hour' },
    { name: 'Water Supply', icon: 'water', unit: 'Per Jar' },
    { name: 'WiFi Setup', icon: 'wifi', unit: 'Per Visit' },
    { name: 'AC Repair', icon: 'air-conditioner', unit: 'Per Service' },
    { name: 'Bike Rental', icon: 'motorbike', unit: 'Per Day' },
    { name: 'RO Service', icon: 'water-pump', unit: 'Per Service' },
    { name: 'Electrician', icon: 'flash', unit: 'Per Visit' },
    { name: 'Carpenter', icon: 'hammer', unit: 'Per Visit' }
];

// Helper to pick random item
function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to pick n random items
function randomItems<T>(arr: T[], n: number): T[] {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
}

import dns from 'dns';

// Force custom DNS to resolve SRV lookup failures
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.log('Could not set custom DNS servers');
}

const seedDatabase = async () => {
    try {
        console.log('🌱 Connecting to database...');
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log('✅ Connected.');

        // 1. Clear existing data
        console.log('🧹 Clearing existing data...');
        await User.deleteMany({});
        await Room.deleteMany({});
        await MessPlan.deleteMany({});
        await Service.deleteMany({});
        await Booking.deleteMany({});
        // await Review.deleteMany({});

        // 2. Define password (plain text, will be hashed by User model pre-save hook)
        const password = 'password123';

        // 2.1 Create Admin User
        console.log('🛡️ Creating Admin User...');
        await User.create({
            name: 'Admin User',
            email: 'admin@roomnmeal.com',
            phone: '9999999999',
            password: password,
            role: 'admin',
            isVerified: true,
            profilePicture: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
        });

        // 3. Create Students (60)
        console.log('👤 Creating 60 Students...');
        for (let i = 0; i < 60; i++) {
            const cityInfo = randomItem(CITIES);
            await User.create({
                name: faker.person.fullName(),
                email: faker.internet.email().toLowerCase(),
                phone: faker.phone.number().replace(/\D/g, '').slice(0, 10).padEnd(10, '9'),
                password: password,
                role: 'student',
                isVerified: Math.random() > 0.3,
                profilePicture: faker.image.avatar(),
            });
        }

        // 4. Create Room Owners (15)
        console.log('🏠 Creating 15 Room Owners & Rooms...');
        for (let i = 0; i < 15; i++) {
            const cityInfo = randomItem(CITIES);

            // Create Owner User
            const owner = await User.create({
                name: faker.person.fullName(),
                email: `room_owner_${i}@example.com`,
                phone: faker.phone.number().replace(/\D/g, '').slice(0, 10).padEnd(10, '9'),
                password: password,
                role: 'owner',
                isVerified: true,
                profilePicture: faker.image.avatar(),
            });

            // Create 2-5 Rooms for this owner
            const numRooms = Math.floor(Math.random() * 4) + 2;
            for (let j = 0; j < numRooms; j++) {
                const roomType = randomItem(['single', 'double', 'triple', 'dormitory']);
                const gender = randomItem(['male', 'female', 'any']);

                await Room.create({
                    ownerId: owner._id,
                    title: `${faker.word.adjective()} ${roomType} Room in ${cityInfo.name}`,
                    description: faker.lorem.paragraph(),
                    price: faker.number.int({ min: 3000, max: 15000 }),
                    deposit: faker.number.int({ min: 5000, max: 20000 }),
                    location: {
                        address: faker.location.streetAddress(),
                        city: cityInfo.name,
                        state: cityInfo.state,
                        pincode: cityInfo.pincode
                    },
                    images: [
                        `https://source.unsplash.com/random/800x600/?room,bedroom&sig=${i}${j}1`,
                        `https://source.unsplash.com/random/800x600/?interior&sig=${i}${j}2`
                    ],
                    facilities: randomItems(AMENITIES, 5),
                    roomType: roomType,
                    gender: gender,
                    isApproved: true,
                    isActive: true,
                    availableFrom: new Date()
                });
            }
        }

        // 5. Create Mess Owners (15)
        console.log('🍱 Creating 15 Mess Owners & Plans...');
        for (let i = 0; i < 15; i++) {
            const cityInfo = randomItem(CITIES);

            const owner = await User.create({
                name: faker.person.fullName(),
                email: `mess_owner_${i}@example.com`,
                phone: faker.phone.number().replace(/\D/g, '').slice(0, 10).padEnd(10, '9'),
                password: password,
                role: 'owner',
                isVerified: true,
                profilePicture: faker.image.avatar(),
            });

            // Create Veg Plan
            await MessPlan.create({
                ownerId: owner._id,
                providerName: `${faker.person.lastName()} Mess Service`,
                description: 'Pure Veg Homemade Food',
                monthlyPrice: faker.number.int({ min: 2500, max: 4500 }),
                menu: {
                    breakfast: randomItems(MEALS, 3),
                    lunch: randomItems(MEALS, 4),
                    dinner: randomItems(MEALS, 4)
                },
                location: {
                    address: faker.location.streetAddress(),
                    city: cityInfo.name,
                    state: cityInfo.state,
                    pincode: cityInfo.pincode
                },
                mealTimings: {
                    breakfast: '8:00 AM - 10:00 AM',
                    lunch: '12:30 PM - 2:30 PM',
                    dinner: '7:30 PM - 9:30 PM'
                },
                includedMeals: ['breakfast', 'lunch', 'dinner'],
                serviceType: randomItem(['both', 'delivery', 'pickup']),
                isApproved: true,
                isActive: true,
                images: [`https://source.unsplash.com/random/800x600/?thali,indianfood&sig=${i}`]
            });

            // Create Non-Veg Plan (Optional 2nd plan)
            if (Math.random() > 0.3) {
                await MessPlan.create({
                    ownerId: owner._id,
                    providerName: `${faker.person.lastName()} Non-Veg Delights`,
                    description: 'Spicy Non-Veg Tiffin Service',
                    monthlyPrice: faker.number.int({ min: 3500, max: 6000 }),
                    menu: {
                        breakfast: randomItems(MEALS, 2),
                        lunch: ['Chicken Curry', 'Rice', 'Chapati'],
                        dinner: ['Egg Curry', 'Rice', 'Salad']
                    },
                    location: {
                        address: faker.location.streetAddress(),
                        city: cityInfo.name,
                        state: cityInfo.state,
                        pincode: cityInfo.pincode
                    },
                    includedMeals: ['lunch', 'dinner'],
                    serviceType: 'delivery',
                    isApproved: true,
                    isActive: true,
                    images: [`https://source.unsplash.com/random/800x600/?chicken,curry&sig=${i}nv`]
                });
            }
        }

        // 6. Create Service Owners (10)
        console.log('🛠️ Creating 10 Service Owners...');
        for (let i = 0; i < 10; i++) {
            const cityInfo = randomItem(CITIES);
            const serviceType = SERVICE_TYPES[i % SERVICE_TYPES.length];

            const owner = await User.create({
                name: faker.person.fullName(),
                email: `service_owner_${i}@example.com`,
                phone: faker.phone.number().replace(/\D/g, '').slice(0, 10).padEnd(10, '9'),
                password: password,
                role: 'owner',
                isVerified: true,
                profilePicture: faker.image.avatar(),
            });

            await Service.create({
                ownerId: owner._id,
                name: `${faker.person.firstName()}'s ${serviceType.name}`,
                description: `Professional ${serviceType.name} at your doorstep.`,
                price: faker.number.int({ min: 100, max: 1000 }),
                unit: serviceType.unit,
                icon: serviceType.icon,
                location: {
                    address: faker.location.streetAddress(),
                    city: cityInfo.name,
                    state: cityInfo.state,
                    pincode: cityInfo.pincode
                },
                isActive: true,
                images: [`https://source.unsplash.com/random/800x600/?worker,tool&sig=${i}svc`]
            });
        }

        console.log('✅ Database seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
