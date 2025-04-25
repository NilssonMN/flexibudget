const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Expense = require('./models/Expense');

dotenv.config({ path: '../.env' });

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Map old to new categories
    const categoryMap = {
      Needs: 'Fixed Monthly Costs',
      Wants: 'Variable Expenses',
      Savings: 'Savings',
      Income: 'Income',
    };

    // Update all documents
    const expenses = await Expense.find();
    for (const expense of expenses) {
      if (categoryMap[expense.category] && expense.category !== categoryMap[expense.category]) {
        expense.category = categoryMap[expense.category];
        await expense.save();
        console.log(`Updated: ${expense._id} to ${expense.category}`);
      }
    }

    console.log('Migration complete');
    await mongoose.connection.close();
  })
  .catch((err) => {
    console.error('Error:', err);
    mongoose.connection.close();
  });