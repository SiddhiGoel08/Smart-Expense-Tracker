const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const budgetRoutes = require('./routes/budgetRoutes');
const monthlyBudgetRoutes = require('./routes/monthlyBudgetRoutes');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/monthly-budget', monthlyBudgetRoutes);


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});