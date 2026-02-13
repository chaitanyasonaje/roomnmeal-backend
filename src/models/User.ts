import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface IUser extends Document {
    // cleaned up unused fields
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: 'student' | 'owner' | 'admin';
    isVerified: boolean;
    createdAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateAuthToken(): string;
    profilePicture?: string;
    idProofType?: 'AADHAR' | 'PAN' | 'COLLEGE_ID';
    idProofUrl?: string;
}

const userSchema = new Schema<IUser>({
    // cleaned up unused fields
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
        unique: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    password: {
        type: String,
        required: false, // Password handled by Clerk for new users
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    role: {
        type: String,
        enum: ['student', 'owner', 'admin'],
        default: 'student',
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    profilePicture: {
        type: String,
    },
    idProofType: {
        type: String,
        enum: ['AADHAR', 'PAN', 'COLLEGE_ID'],
    },
    idProofUrl: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function (): string {
    const payload = {
        id: this._id,
        email: this.email,
        role: this.role,
    };

    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, {
        expiresIn: '7d',
    } as jwt.SignOptions);

    return token;
};

export default mongoose.model<IUser>('User', userSchema);
