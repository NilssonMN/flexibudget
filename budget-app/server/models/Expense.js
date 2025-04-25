const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  income: { type: Number, default: 0 },
  amount: { type: Number },
  category: { 
    type: String, 
    enum: ['Fixed Monthly Costs', 'Variable Expenses', 'Savings', 'Income'], 
    default: 'Fixed Monthly Costs' 
  },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Expense', expenseSchema);