import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    amount: number;
    category: 'Rent' | 'Food' | 'Travel' | 'Utilities' | 'Other';
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    category: {
        type: String,
        enum: ['Rent', 'Food', 'Travel', 'Utilities', 'Other'],
        required: true
    },
    date: { type: Date, default: Date.now },
}, {
    timestamps: true
});

// Index for efficient querying by user and date
expenseSchema.index({ userId: 1, date: -1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
