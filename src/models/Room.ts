import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
    title: string;
    description: string;
    price: number;
    deposit: number;
    location: {
        address: string;
        city: string;
        state: string;
        pincode: string;
    };
    images: string[];
    facilities: string[];
    roomType: 'single' | 'double' | 'triple' | 'dormitory';
    gender: 'male' | 'female' | 'any';
    availableFrom: Date;
    ownerId: mongoose.Types.ObjectId;
    isApproved: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const roomSchema = new Schema<IRoom>({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide monthly rent'],
        min: [0, 'Price cannot be negative'],
    },
    deposit: {
        type: Number,
        required: [true, 'Please provide deposit amount'],
        min: [0, 'Deposit cannot be negative'],
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
    images: {
        type: [String],
        validate: {
            validator: function (v: string[]) {
                return v.length > 0 && v.length <= 10;
            },
            message: 'Please provide 1-10 images',
        },
    },
    facilities: {
        type: [String],
        default: [],
    },
    roomType: {
        type: String,
        enum: ['single', 'double', 'triple', 'dormitory'],
        required: true,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'any'],
        default: 'any',
    },
    availableFrom: {
        type: Date,
        default: Date.now,
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Index for faster queries
roomSchema.index({ city: 1, isApproved: 1, isActive: 1 });
roomSchema.index({ price: 1 });

export default mongoose.model<IRoom>('Room', roomSchema);
