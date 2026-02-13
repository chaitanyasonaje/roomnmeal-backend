import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
    userId: mongoose.Types.ObjectId;
    bookingType: 'room' | 'mess';
    roomId?: mongoose.Types.ObjectId;
    messPlanId?: mongoose.Types.ObjectId;
    startDate: Date;
    endDate?: Date;
    durationInMonths?: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    paymentId?: mongoose.Types.ObjectId;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bookingType: {
        type: String,
        enum: ['room', 'mess'],
        required: true,
    },
    roomId: {
        type: Schema.Types.ObjectId,
        ref: 'Room',
        required: function (this: IBooking) {
            return this.bookingType === 'room';
        },
    },
    messPlanId: {
        type: Schema.Types.ObjectId,
        ref: 'MessPlan',
        required: function (this: IBooking) {
            return this.bookingType === 'mess';
        },
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide start date'],
    },
    endDate: {
        type: Date,
    },
    durationInMonths: {
        type: Number,
        min: 1,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending',
    },
    paymentId: {
        type: Schema.Types.ObjectId,
        ref: 'Payment',
    },
    totalAmount: {
        type: Number,
        required: [true, 'Please provide total amount'],
        min: [0, 'Amount cannot be negative'],
    },
}, {
    timestamps: true,
});

// Indexes
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ roomId: 1 });
bookingSchema.index({ messPlanId: 1 });

export default mongoose.model<IBooking>('Booking', bookingSchema);
