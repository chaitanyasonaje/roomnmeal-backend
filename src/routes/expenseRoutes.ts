import express from 'express';
import { authenticate } from '../middleware/auth';
import { addExpense, getMyExpenses, getExpenseSummary, deleteExpense } from '../controllers/expenseController';
import { validate, addExpenseRules, mongoIdParam } from '../middleware/validators';

const router = express.Router();

router.use(authenticate); // Protect all routes

router.post('/', addExpenseRules, validate, addExpense);
router.get('/', getMyExpenses);
router.get('/summary', getExpenseSummary);
router.delete('/:id', mongoIdParam(), validate, deleteExpense);

export default router;

