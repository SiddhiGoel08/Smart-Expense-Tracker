const express = require('express');
const RecurringExpense = require('../models/RecurringExpense');
const Expense = require('../models/Expense');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new recurring expense rule
router.post('/', auth, async (req, res) => {
  try {
    const { amount, description, category } = req.body;
    const now = new Date();

    const recurring = await RecurringExpense.create({
      userId: req.userId,
      amount,
      description,
      category,
      lastGeneratedMonth: now.getMonth() + 1,
      lastGeneratedYear: now.getFullYear(),
    });

    // Also create the first actual expense right now
    await Expense.create({
      userId: req.userId,
      amount,
      description,
      category,
      date: now,
    });

    res.status(201).json(recurring);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all recurring rules
router.get('/', auth, async (req, res) => {
  const recurring = await RecurringExpense.find({ userId: req.userId });
  res.json(recurring);
});

// Delete a recurring rule (stops future auto-adds)
router.delete('/:id', auth, async (req, res) => {
  await RecurringExpense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ message: 'Deleted' });
});

// Check and generate expenses for the current month if not already done
router.post('/process', auth, async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const rules = await RecurringExpense.find({ userId: req.userId });
    let generatedCount = 0;

    for (const rule of rules) {
      if (rule.lastGeneratedMonth !== currentMonth || rule.lastGeneratedYear !== currentYear) {
        await Expense.create({
          userId: req.userId,
          amount: rule.amount,
          description: rule.description,
          category: rule.category,
          date: now,
        });
        rule.lastGeneratedMonth = currentMonth;
        rule.lastGeneratedYear = currentYear;
        await rule.save();
        generatedCount++;
      }
    }

    res.json({ generatedCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;