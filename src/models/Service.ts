import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
    name: string;
    description: string;
    price: number;
    unit: string;
    icon: string;
    location: {
        address: string;
        city: string;
        state: string;
        pincode: string;
    };
    isActive: boolean;
    ownerId: mongoose.Schema.Types.ObjectId;
    images: string[];
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const serviceSchema = new Schema<IService>({
    name: {
        type: String,
        required: [true, 'Please provide service name'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide service description'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide price'],
        min: 0,
    },
    unit: {
        type: String,
        required: [true, 'Please provide unit (e.g., Per Kg, Per Hour)'],
    },
    icon: {
        type: String,
        required: [true, 'Please provide icon name (MaterialCommunityIcons)'],
    },
    location: {
        address: {
            type: String,
            required: [true, 'Please provide address'],
        },
        city: {
            type: String,
            required: [true, 'Please provide city'],
        },
        state: {
            type: String,
            required: [true, 'Please provide state'],
        },
        pincode: {
            type: String,
            required: [true, 'Please provide pincode'],
            match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode'],
        },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    images: {
        type: [String],
        default: [],
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual for status
serviceSchema.virtual('status').get(function () {
    if (this.isApproved) return 'approved';
    if (!this.isActive) return 'rejected';
    return 'pending';
});

// Index for faster queries
serviceSchema.index({ 'location.city': 1, isApproved: 1, isActive: 1 });

export default mongoose.model<IService>('Service', serviceSchema);
