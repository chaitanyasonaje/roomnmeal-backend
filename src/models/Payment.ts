import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
    userId: mongoose.Types.ObjectId;
    bookingId: mongoose.Types.ObjectId;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    amount: number;
    currency: string;
    status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
    paymentMethod?: string;
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bookingId: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
    },
    razorpayOrderId: {
        type: String,
        required: true,
        unique: true,
    },
    razorpayPaymentId: {
        type: String,
    },
    razorpaySignature: {
        type: String,
    },
    amount: {
        type: Number,
        required: [true, 'Please provide amount'],
        min: [0, 'Amount cannot be negative'],
    },
    currency: {
        type: String,
        default: 'INR',
    },
    status: {
        type: String,
        enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
        default: 'created',
    },
    paymentMethod: {
        type: String,
    },
}, {
    timestamps: true,
});

// Indexes
paymentSchema.index({ userId: 1 });
paymentSchema.index({ bookingId: 1 });

export default mongoose.model<IPayment>('Payment', paymentSchema);
