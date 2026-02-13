import mongoose, { Schema, Document } from 'mongoose';

export interface IRoommateProfile extends Document {
    userId: mongoose.Types.ObjectId;
    college: string;
    city: string; // Added for location-based finding
    budget: number;
    moveInDate: Date;
    gender: 'Male' | 'Female' | 'Any';
    habits: {
        smoking: boolean;
        drinking: boolean;
        vegetarian: boolean;
        earlyBird: boolean;
        nightOwl: boolean;
        petFriendly: boolean;
    };
    bio: string;
    interests: string[];
    contactHidden: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const roommateProfileSchema = new Schema<IRoommateProfile>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    college: { type: String, required: true },
    city: { type: String, required: true }, // Added field
    budget: { type: Number, required: true },
    moveInDate: { type: Date, default: Date.now },
    gender: { type: String, enum: ['Male', 'Female', 'Any'], default: 'Any' },
    habits: {
        smoking: { type: Boolean, default: false },
        drinking: { type: Boolean, default: false },
        vegetarian: { type: Boolean, default: false },
        earlyBird: { type: Boolean, default: false },
        nightOwl: { type: Boolean, default: false },
        petFriendly: { type: Boolean, default: false },
    },
    bio: { type: String, maxlength: 500 },
    interests: [{ type: String }],
    contactHidden: { type: Boolean, default: false },
}, {
    timestamps: true
});

// Index for efficient searching
roommateProfileSchema.index({ city: 1, college: 1, budget: 1, gender: 1 });

export const RoommateProfile = mongoose.model<IRoommateProfile>('RoommateProfile', roommateProfileSchema);
