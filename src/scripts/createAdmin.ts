import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';
import path from 'path';

// Configuring dotenv to point to .env file in root/backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import dns from 'dns';

// Force custom DNS to resolve SRV lookup failures
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.log('Could not set custom DNS servers');
}

const createAdmin = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            console.error('MONGODB_URI is not defined in .env file');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        // @ts-ignore
        await mongoose.connect(mongoURI, { family: 4 });
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@roomnmeal.com';
        const adminPassword = 'adminpassword123';
        const adminPhone = '9999999999'; // Dummy phone for admin

        // Check if admin already exists
        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Admin user already exists.');
            if (admin.role !== 'admin') {
                console.log('Updating role to admin...');
                admin.role = 'admin';
                await admin.save();
                console.log('Role updated to admin.');
            }
        } else {
            console.log('Creating new admin user...');
            admin = await User.create({
                name: 'System Admin',
                email: adminEmail,
                phone: adminPhone,
                password: adminPassword,
                role: 'admin',
                isVerified: true
            });
            console.log('Admin user created successfully.');
        }

        console.log('-----------------------------------');
        console.log('Admin Credentials:');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log('-----------------------------------');

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdmin();
