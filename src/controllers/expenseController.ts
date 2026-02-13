import { Request, Response } from 'express';
import { Expense } from '../models/Expense';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// Add Expense
export const addExpense = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { title, amount, category, date } = req.body;

        const expense = await Expense.create({
            userId: req.user.id,
            title,
            amount,
            category,
            date: date || Date.now()
        });

        res.status(201).json({ success: true, data: expense });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get My Expenses (with optional filters)
export const getMyExpenses = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { month, year } = req.query;
        let query: any = { userId: req.user.id };

        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const expenses = await Expense.find(query).sort({ date: -1 });

        res.json({ success: true, count: expenses.length, data: expenses });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get Expense Summary (Group by category)
export const getExpenseSummary = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { month, year } = req.query;
        let matchStage: any = { userId: new mongoose.Types.ObjectId(req.user.id as string) };

        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
            matchStage.date = { $gte: startDate, $lte: endDate };
        }

        const stats = await Expense.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$category',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching expense summary:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Delete Expense
export const deleteExpense = async (req: AuthRequest, res: Response) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        if (expense.userId.toString() !== req.user?.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await expense.deleteOne();

        res.json({ success: true, data: {} });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
