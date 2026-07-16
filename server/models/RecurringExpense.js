const mongoose = require('mongoose');

const recurringExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  lastGeneratedMonth: { type: Number, required: true },
  lastGeneratedYear: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema);