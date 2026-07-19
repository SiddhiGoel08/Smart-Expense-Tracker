const { body, validationResult } = require('express-validator');
const express = require('express');
const Expense = require('../models/Expense');
const CategoryRule = require('../models/CategoryRule');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

const defaultKeywords = {
  Food: ['swiggy', 'zomato', 'restaurant', 'food', 'cafe', 'coffee', 'dominos', 'pizza', 'burger', 'dinner', 'lunch', 'breakfast', 'grocery', 'groceries'],
  Transport: ['uber', 'ola', 'petrol', 'fuel', 'diesel', 'cab', 'taxi', 'bus', 'train', 'metro', 'auto', 'rickshaw'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'shopping', 'mall', 'clothes', 'shoes'],
  Entertainment: ['netflix', 'spotify', 'movie', 'prime', 'cinema', 'concert', 'game', 'gaming'],
  Bills: ['electricity', 'water bill', 'recharge', 'wifi', 'internet', 'rent', 'emi'],
};

async function autoCategory(description, userId) {
  const desc = description.toLowerCase();

  const userRules = await CategoryRule.find({ userId });
  for (const rule of userRules) {
    if (desc.includes(rule.keyword.toLowerCase())) {
      return rule.category;
    }
  }

  for (const [category, keywords] of Object.entries(defaultKeywords)) {
    if (keywords.some((k) => desc.includes(k))) {
      return category;
    }
  }

  return 'Uncategorized';
}

// Export to CSV — must come before any '/:id' routes
router.get('/export/csv', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.userId }).sort({ date: -1 });

    let csv = 'Description,Category,Amount,Date\n';
    expenses.forEach((exp) => {
      const row = [
        `"${exp.description.replace(/"/g, '""')}"`,
        exp.category,
        exp.amount,
        new Date(exp.date).toLocaleDateString(),
      ].join(',');
      csv += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(csv);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


  router.post('/', auth, [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('description').trim().notEmpty().withMessage('Description is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  try {
    const { amount, description, date, category } = req.body;
    const detectedCategory = await autoCategory(description, req.userId);
    const finalCategory = category || detectedCategory;

    const expense = await Expense.create({
      userId: req.userId, amount, description, date, category: finalCategory,
    });

    if (category && category !== detectedCategory && category !== 'Uncategorized') {
      const mainWord = description.toLowerCase().split(' ')[0];
      await CategoryRule.findOneAndUpdate(
        { userId: req.userId, keyword: mainWord },
        { category },
        { upsert: true }
      );
    }

    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { category, startDate, endDate, minAmount, maxAmount, search } = req.query;
    const filter = { userId: req.userId };

    if (category) filter.category = category;
    if (search) filter.description = { $regex: search, $options: 'i' };
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.date.$lte = endOfDay;
      }
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId }, req.body, { new: true }
    );
    res.json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ message: 'Deleted' });
});
// Monthly trend: total spending per month for the last 6 months
router.get('/trend', auth, async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const expenses = await Expense.find({
      userId: req.userId,
      date: { $gte: sixMonthsAgo },
    });

    const monthlyTotals = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthlyTotals[key] = {
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        total: 0,
        sortKey: d.getFullYear() * 100 + d.getMonth(),
      };
    }

    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (monthlyTotals[key]) {
        monthlyTotals[key].total += exp.amount;
      }
    });

    const result = Object.values(monthlyTotals).sort((a, b) => a.sortKey - b.sortKey);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Month-over-month comparison by category
router.get('/comparison', auth, async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const thisMonthExpenses = await Expense.find({
      userId: req.userId,
      date: { $gte: thisMonthStart, $lte: thisMonthEnd },
    });
    const lastMonthExpenses = await Expense.find({
      userId: req.userId,
      date: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });

    const sumByCategory = (list) => {
      const totals = {};
      list.forEach((e) => {
        totals[e.category] = (totals[e.category] || 0) + e.amount;
      });
      return totals;
    };

    const thisMonthTotals = sumByCategory(thisMonthExpenses);
    const lastMonthTotals = sumByCategory(lastMonthExpenses);

    const alerts = [];
    for (const category in thisMonthTotals) {
      const current = thisMonthTotals[category];
      const previous = lastMonthTotals[category] || 0;
      if (previous > 0) {
        const percentChange = Math.round(((current - previous) / previous) * 100);
        if (percentChange >= 20) {
          alerts.push({ category, percentChange, current, previous });
        }
      }
    }

    res.json({ thisMonthTotals, lastMonthTotals, alerts });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



module.exports = router;