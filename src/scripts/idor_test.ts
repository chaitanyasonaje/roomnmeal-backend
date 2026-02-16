import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Payment from '../models/Payment';
import User from '../models/User';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testIDOR() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to DB');

        // Find a payment
        const payment = await Payment.findOne();
        if (!payment) {
            console.log('No payments found in DB to test with.');
            return;
        }
        const paymentId = payment._id;
        const ownerId = payment.userId;

        // Find another user (not the owner)
        const otherUser = await User.findOne({ _id: { $ne: ownerId } });
        if (!otherUser) {
            console.log('No other user found to test IDOR.');
            return;
        }

        console.log(`Testing IDOR: Accessing Payment ${paymentId} (owned by ${ownerId}) as User ${otherUser._id}`);

        // In a real attack, we would use the token of 'otherUser' to call GET /api/payments/:id
        // Since we are server-side, we can just check the controller logic.
        // We already saw in paymentController.ts that it doesn't check for ownership.

        console.log('CONFIRMED BY CODE AUDIT: paymentController.ts getPaymentDetails does NOT check for user ownership.');
    } catch (error: any) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

testIDOR();
