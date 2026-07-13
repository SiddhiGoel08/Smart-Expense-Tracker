const express = require('express');
const Expense = require('../models/Expense');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

const categoryKeywords = {
  Food: ['swiggy', 'zomato', 'restaurant', 'food'],
  Transport: ['uber', 'ola', 'petrol', 'fuel'],
  Shopping: ['amazon', 'flipkart', 'myntra'],
  Entertainment: ['netflix', 'spotify', 'movie', 'prime'],
};

function autoCategory(description) {
  const desc = description.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(k => desc.includes(k))) return category;
  }
  return 'Uncategorized';
}

router.post('/', auth, async (req, res) => {
  try {
    const { amount, description, date, category } = req.body;
    const finalCategory = category || autoCategory(description);
    const expense = await Expense.create({
      userId: req.userId, amount, description, date, category: finalCategory,
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  const expenses = await Expense.find({ userId: req.userId }).sort({ date: -1 });
  res.json(expenses);
});

router.put('/:id', auth, async (req, res) => {
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId }, req.body, { new: true }
  );
  res.json(expense);
});

router.delete('/:id', auth, async (req, res) => {
  await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ message: 'Deleted' });
});

module.exports = router;