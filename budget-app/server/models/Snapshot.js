const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema({
  user: { type: String, required: true },
  name: { type: String, required: true },
  income: { type: Number, required: true },
  expenses: [{
    category: { type: String, enum: ['Fixed Monthly Costs', 'Variable Expenses', 'Savings'], required: true },
    amount: { type: Number, required: true },
    description: { type: String }
  }],
  template: { type: String, enum: ['50/30/20', '70/20/10'], default: '50/30/20' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Snapshot', snapshotSchema);