import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceRequest extends Document {
    userId: mongoose.Types.ObjectId;
    serviceId: mongoose.Types.ObjectId;
    date: Date;
    slot: string;
    quantity: number;
    totalAmount: number;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
    otp: string;
    createdAt: Date;
    updatedAt: Date;
}

const serviceRequestSchema = new Schema<IServiceRequest>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    serviceId: {
        type: Schema.Types.ObjectId,
        ref: 'Service',
        required: true,
    },
    date: {
        type: Date,
        required: [true, 'Please provide date'],
    },
    slot: {
        type: String,
        required: [true, 'Please provide time slot'],
    },
    quantity: {
        type: Number,
        required: [true, 'Please provide quantity'],
        min: 1,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending',
    },
    otp: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

// Indexes
serviceRequestSchema.index({ userId: 1, status: 1 });
serviceRequestSchema.index({ serviceId: 1 });

export default mongoose.model<IServiceRequest>('ServiceRequest', serviceRequestSchema);
