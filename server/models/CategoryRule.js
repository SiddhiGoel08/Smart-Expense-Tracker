const mongoose = require('mongoose');

const categoryRuleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  keyword: { type: String, required: true },
  category: { type: String, required: true },
}, { timestamps: true });

categoryRuleSchema.index({ userId: 1, keyword: 1 }, { unique: true });

module.exports = mongoose.model('CategoryRule', categoryRuleSchema);