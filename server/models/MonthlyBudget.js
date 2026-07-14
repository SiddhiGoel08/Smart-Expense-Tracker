const mongoose = require('mongoose');

const monthlyBudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  limit: { type: Number, required: true },
}, { timestamps: true });

monthlyBudgetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyBudget', monthlyBudgetSchema);