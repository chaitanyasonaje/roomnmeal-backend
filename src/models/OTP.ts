import mongoose, { Document, Schema } from 'mongoose';

export interface IOTP extends Document {
    identifier: string; // email or phone
    otp: string;
    expiresAt: Date;
    createdAt: Date;
}

const otpSchema = new Schema<IOTP>({
    identifier: {
        type: String,
        required: true,
        index: true,
    },
    otp: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300, // Automatically delete doc after 5 minutes (300 seconds)
    },
});

export default mongoose.model<IOTP>('OTP', otpSchema);
