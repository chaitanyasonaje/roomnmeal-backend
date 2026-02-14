import mongoose, { Document, Schema } from 'mongoose';

export interface IMessPlan extends Document {
    providerName: string;
    description: string;
    monthlyPrice: number;
    menu: {
        breakfast: string[];
        lunch: string[];
        dinner: string[];
    };
    location: {
        address: string;
        city: string;
        state: string;
        pincode: string;
    };
    mealTimings: {
        breakfast: string;
        lunch: string;
        dinner: string;
    };
    includedMeals: string[];
    serviceType: 'delivery' | 'pickup' | 'both';
    ownerId: mongoose.Types.ObjectId;
    isApproved: boolean;
    isActive: boolean;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
}

const messPlanSchema = new Schema<IMessPlan>({
    providerName: {
        type: String,
        required: [true, 'Please provide provider name'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    monthlyPrice: {
        type: Number,
        required: [true, 'Please provide monthly price'],
        min: [0, 'Price cannot be negative'],
    },
    menu: {
        breakfast: {
            type: [String],
            default: [],
        },
        lunch: {
            type: [String],
            default: [],
        },
        dinner: {
            type: [String],
            default: [],
        },
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
    mealTimings: {
        breakfast: {
            type: String,
            default: '8:00 AM - 10:00 AM',
        },
        lunch: {
            type: String,
            default: '12:00 PM - 2:00 PM',
        },
        dinner: {
            type: String,
            default: '7:00 PM - 9:00 PM',
        },
    },
    includedMeals: {
        type: [String],
        enum: ['breakfast', 'lunch', 'dinner'],
        required: [true, 'Please specify included meals'],
    },
    serviceType: {
        type: String,
        enum: ['delivery', 'pickup', 'both'],
        default: 'both',
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
    images: {
        type: [String],
        default: [],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual for status
messPlanSchema.virtual('status').get(function () {
    if (this.isApproved) return 'approved';
    if (!this.isActive) return 'rejected';
    return 'pending';
});

// Index for faster queries
messPlanSchema.index({ city: 1, isApproved: 1, isActive: 1 });
messPlanSchema.index({ monthlyPrice: 1 });

export default mongoose.model<IMessPlan>('MessPlan', messPlanSchema);
