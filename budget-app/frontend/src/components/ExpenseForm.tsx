import React, { useState } from 'react';
import { translate, Currency } from '../utils/translations';
import { ExpenseService } from '../services/expenseService';

interface ExpenseFormProps {
  onExpenseAdded: (expense: any) => void;
  userId: string | null;
  currency: Currency;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onExpenseAdded, userId, currency }) => {
  // Form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Fixed Monthly Costs');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert(translate('invalidAmount', currency));
      return;
    }
    if (!userId) {
      alert('User not authenticated');
      return;
    }
    setLoading(true);
    try {
      const newExpense = await ExpenseService.addExpense({ amount: parsedAmount, category, description }, userId);
      onExpenseAdded(newExpense);
      setAmount('');
      setDescription('');
      // Keep category as selected
    } catch (err: any) {
      alert(`${translate('failedExpense', currency)}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Main render
  return (
    <section className="expense-form-section">
      <form id="expense-form" onSubmit={handleSubmit}>
        <select
          id="category"
          required
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="Fixed Monthly Costs" id="category-fixed-monthly-costs">
            {translate('categoryFixedMonthlyCosts', currency)}
          </option>
          <option value="Variable Expenses" id="category-variable-expenses">
            {translate('categoryVariableExpenses', currency)}
          </option>
          <option value="Savings" id="category-savings">
            {translate('categorySavings', currency)}
          </option>
        </select>
        <input
          type="number"
          id="amount"
          required
          step="0.01"
          placeholder={translate('amountPlaceholder', currency)}
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <input
          type="text"
          id="description"
          placeholder={translate('descriptionPlaceholder', currency)}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <button type="submit" id="expense-button" disabled={loading}>
          {loading ? translate('loading', currency) : translate('expenseButton', currency)}
        </button>
      </form>
    </section>
  );
};

export default ExpenseForm; 