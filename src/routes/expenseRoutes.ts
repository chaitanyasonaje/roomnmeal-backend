import express from 'express';
import { authenticate } from '../middleware/auth';
import { addExpense, getMyExpenses, getExpenseSummary, deleteExpense } from '../controllers/expenseController';

const router = express.Router();

router.use(authenticate); // Protect all routes

router.post('/', addExpense);
router.get('/', getMyExpenses);
router.get('/summary', getExpenseSummary);
router.delete('/:id', deleteExpense);

export default router;
