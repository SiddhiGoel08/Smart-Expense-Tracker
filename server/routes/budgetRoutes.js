const express = require('express');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Set or update a budget for a category
router.post('/', auth, async (req, res) => {
  try {
    const { category, limit } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId, category },
      { limit },
      { new: true, upsert: true }
    );
    res.status(201).json(budget);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all budgets with current spending per category
router.get('/', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.userId });

    const budgetsWithSpending = await Promise.all(
      budgets.map(async (b) => {
        const expenses = await Expense.find({ userId: req.userId, category: b.category });
        const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
        return {
          _id: b._id,
          category: b.category,
          limit: b.limit,
          spent,
          percentUsed: Math.round((spent / b.limit) * 100),
        };
      })
    );

    res.json(budgetsWithSpending);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a budget
router.delete('/:id', auth, async (req, res) => {
  await Budget.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ message: 'Deleted' });
});

module.exports = router;