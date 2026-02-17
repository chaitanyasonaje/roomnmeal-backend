
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';
import Booking from './src/models/Booking';
import Payout from './src/models/Payout';
import Room from './src/models/Room';

dotenv.config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to DB');

        const ownerCount = await User.countDocuments({ role: 'owner' });
        const bookingCount = await Booking.countDocuments({});
        const payoutCount = await Payout.countDocuments({});

        console.log(`Owners: ${ownerCount}`);
        console.log(`Bookings: ${bookingCount}`);
        console.log(`Payouts: ${payoutCount}`);

        if (payoutCount === 0) {
            console.log('No payouts found. Creating seed data...');

            // Find an owner
            let owner = await User.findOne({ role: 'owner' });
            if (!owner) {
                console.log('No owner found, creating one...');
                owner = await User.create({
                    name: 'Test Owner',
                    email: 'testowner@example.com',
                    password: 'password123',
                    role: 'owner',
                    phone: '9876543210',
                    isVerified: true
                });
            }

            // check if owner has bank details, if not add them
            if (!owner.bankDetails || !owner.bankDetails.accountNumber) {
                owner.bankDetails = {
                    accountHolderName: owner.name,
                    accountNumber: '1234567890',
                    ifscCode: 'SBIN0001234',
                    upiId: 'testowner@upi'
                };
                await owner.save();
                console.log('Added bank details to owner');
            }

            // Create a dummy payout request
            const payout = await Payout.create({
                ownerId: owner._id,
                amount: 5000,
                status: 'pending',
                createdAt: new Date()
            });
            console.log('Created seeded payout:', payout);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkData();
