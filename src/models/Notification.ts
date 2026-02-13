import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    relatedId?: mongoose.Types.ObjectId;
    relatedModel?: string; // 'Booking', 'Complaint', 'ServiceRequest'
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error'],
        default: 'info',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    relatedId: {
        type: Schema.Types.ObjectId,
    },
    relatedModel: {
        type: String,
        enum: ['Booking', 'Complaint', 'ServiceRequest'],
    },
}, {
    timestamps: true,
});

// Index for fetching user's notifications sorted by date
notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', notificationSchema);
