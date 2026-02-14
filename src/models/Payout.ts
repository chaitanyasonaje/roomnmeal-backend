import mongoose, { Document, Schema } from 'mongoose';

export interface IPayout extends Document {
    ownerId: mongoose.Types.ObjectId;
    amount: number;
    status: 'pending' | 'processing' | 'paid' | 'rejected';
    processedAt?: Date;
    transactionId?: string;
    adminNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const payoutSchema = new Schema<IPayout>({
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: [true, 'Please provide amount'],
        min: [1, 'Minimum payout amount is ₹1'],
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'paid', 'rejected'],
        default: 'pending',
    },
    processedAt: {
        type: Date,
    },
    transactionId: {
        type: String,
        trim: true,
    },
    adminNotes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

// Index for faster queries
payoutSchema.index({ ownerId: 1, status: 1 });

export default mongoose.model<IPayout>('Payout', payoutSchema);
