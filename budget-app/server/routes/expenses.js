const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Snapshot = require('../models/Snapshot');

// Get all expenses and income
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json(expenses);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add a new expense
router.post('/', async (req, res) => {
  try {
    console.log('Received expense:', req.body);
    const expense = new Expense({
      amount: req.body.amount,
      category: req.body.category,
      description: req.body.description,
    });
    const newExpense = await expense.save();
    res.status(201).json(newExpense);
  } catch (err) {
    console.error('Error saving expense:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update income
router.post('/income', async (req, res) => {
  try {
    const { income } = req.body;
    const incomeValue = parseFloat(income);
    if (isNaN(incomeValue) || incomeValue < 0) {
      return res.status(400).json({ message: 'Income must be a non-negative number' });
    }
    const expense = await Expense.findOneAndUpdate(
      { category: 'Income' },
      { income: incomeValue, category: 'Income', amount: 0 },
      { upsert: true, new: true }
    );
    res.json(expense);
  } catch (err) {
    console.error('Error saving income:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(400).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ message: err.message });
  }
});

// Save snapshot
router.post('/snapshots', async (req, res) => {
  const { user, name, income, expenses, template } = req.body;
  console.log('Received snapshot:', req.body);
  if (!user || !name || income === undefined) {
    return res.status(400).json({ message: 'User, name, and income are required' });
  }
  const snapshot = new Snapshot({ user, name, income, expenses, template });
  try {
    const newSnapshot = await snapshot.save();
    console.log('Snapshot saved:', newSnapshot);
    res.status(201).json(newSnapshot);
  } catch (err) {
    console.error('Error saving snapshot:', err);
    res.status(400).json({ message: err.message });
  }
});

// Get snapshots
router.get('/snapshots', async (req, res) => {
  try {
    const snapshots = await Snapshot.find({ user: req.query.user });
    console.log('Fetched snapshots for user:', req.query.user, snapshots);
    res.json(snapshots);
  } catch (err) {
    console.error('Error fetching snapshots:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get snapshot by ID
router.get('/snapshots/:id', async (req, res) => {
  try {
    const snapshot = await Snapshot.findById(req.params.id);
    if (!snapshot) return res.status(404).json({ message: 'Snapshot not found' });
    console.log('Fetched snapshot:', snapshot);
    res.json(snapshot);
  } catch (err) {
    console.error('Error fetching snapshot:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete snapshot
router.delete('/snapshots/:id', async (req, res) => {
  try {
    const snapshot = await Snapshot.findByIdAndDelete(req.params.id);
    if (!snapshot) return res.status(404).json({ message: 'Snapshot not found' });
    console.log('Deleted snapshot:', req.params.id);
    res.json({ message: 'Snapshot deleted' });
  } catch (err) {
    console.error('Error deleting snapshot:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;