import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    text: string;
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema: Schema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
});

export default mongoose.model<IMessage>('Message', messageSchema);
