const express = require('express');
const MonthlyBudget = require('../models/MonthlyBudget');
const Expense = require('../models/Expense');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Set or update this month's budget
router.post('/', auth, async (req, res) => {
  try {
    const { limit } = req.body;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budget = await MonthlyBudget.findOneAndUpdate(
      { userId: req.userId, month, year },
      { limit },
      { new: true, upsert: true }
    );
    res.status(201).json(budget);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get this month's budget status
router.get('/status', auth, async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budget = await MonthlyBudget.findOne({ userId: req.userId, month, year });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const expenses = await Expense.find({
      userId: req.userId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const limit = budget ? budget.limit : null;
    const remaining = limit !== null ? limit - totalSpent : null;
    const percentUsed = limit ? Math.round((totalSpent / limit) * 100) : null;
    const isOverBudget = limit !== null && totalSpent > limit;

    const now2 = new Date();
    const isMonthOver = now2.getDate() === endOfMonth.getDate();

    res.json({
      month,
      year,
      limit,
      totalSpent,
      remaining,
      percentUsed,
      isOverBudget,
      isMonthOver,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;