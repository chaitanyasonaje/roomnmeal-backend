import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaint extends Document {
    userId: mongoose.Types.ObjectId;
    category: 'Plumbing' | 'Electrical' | 'Cleaning' | 'Food' | 'Other';
    title: string;
    description: string;
    images: string[];
    status: 'Open' | 'In Progress' | 'Resolved';
    adminComment?: string;
    createdAt: Date;
    updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    category: {
        type: String,
        enum: ['Plumbing', 'Electrical', 'Cleaning', 'Food', 'Other'],
        required: [true, 'Please select a category'],
    },
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        maxlength: 500,
    },
    images: [{
        type: String,
    }],
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved'],
        default: 'Open',
    },
    adminComment: {
        type: String,
    },
}, {
    timestamps: true,
});

// Indexes
complaintSchema.index({ userId: 1, status: 1 });
complaintSchema.index({ status: 1 });

export default mongoose.model<IComplaint>('Complaint', complaintSchema);
