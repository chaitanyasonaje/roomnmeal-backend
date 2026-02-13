import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../models/Service';
import { connectDatabase } from '../config/database';

dotenv.config();

const seedServices = async () => {
    try {
        await connectDatabase();

        console.log('Connected to DB. Seeding services...');

        await Service.deleteMany({});

        const services = [
            {
                name: 'Laundry',
                description: 'Wash & Fold service. Pickup and delivery included.',
                price: 50,
                unit: 'Per Kg',
                icon: 'washing-machine',
                isActive: true
            },
            {
                name: 'Room Cleaning',
                description: 'Full room deep cleaning including floor and bathroom.',
                price: 200,
                unit: 'Per Session',
                icon: 'broom',
                isActive: true
            },
            {
                name: 'Water',
                description: '20L Water Can delivery.',
                price: 40,
                unit: 'Per Can',
                icon: 'water',
                isActive: true
            },
            {
                name: 'Maintenance',
                description: 'Plumbing, electrical, or furniture repairs.',
                price: 0,
                unit: 'On Inspection',
                icon: 'tools',
                isActive: true
            }
        ];

        await Service.insertMany(services);
        console.log('Services seeded successfully!');

        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedServices();
