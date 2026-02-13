import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
    userId: mongoose.Types.ObjectId;
    targetType: 'room' | 'mess';
    targetId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    targetType: {
        type: String,
        enum: ['room', 'mess'],
        required: true,
    },
    targetId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'targetType',
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
        type: String,
        maxlength: [500, 'Comment cannot exceed 500 characters'],
        default: '',
    },
}, {
    timestamps: true,
});

// One review per user per target
reviewSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
reviewSchema.index({ targetType: 1, targetId: 1 });

export default mongoose.model<IReview>('Review', reviewSchema);
