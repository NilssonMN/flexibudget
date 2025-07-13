import React from 'react';
import { translate, Currency } from '../utils/translations';
import { formatCurrency } from '../utils/currency';
import { ExpenseService } from '../services/expenseService';

export interface Expense {
  _id: string;
  amount: number;
  category: string;
  description?: string;
}

interface ExpenseListProps {
  expenses: Expense[];
  currency: Currency;
  onExpenseDeleted: (expenses: Expense[]) => void;
  activeSnapshot?: any;
  onExitSnapshot?: () => void;
  onEditSnapshot?: () => void;
  onSaveChanges?: () => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, currency, onExpenseDeleted, activeSnapshot, onExitSnapshot, onEditSnapshot, onSaveChanges }) => {
  // Handle delete expense
  const handleDelete = async (id: string) => {
    const prevExpenses = [...expenses];
    const updatedExpenses = expenses.filter(exp => exp._id !== id);
    onExpenseDeleted(updatedExpenses);
    try {
      await ExpenseService.deleteExpense(id);
    } catch (err) {
      onExpenseDeleted(prevExpenses);
    }
  };

  return (
    <section className="expense-list-section">
      <div className="expense-list-header">
        <h2 id="expenses-header">{translate('expensesHeader', currency)}</h2>
        {activeSnapshot && (
          <div className="snapshot-actions">
            {onEditSnapshot && (
              <button
                id="edit-snapshot-btn"
                className="snapshot-action-btn"
                onClick={onEditSnapshot}
              >
                {translate('editThisBudget', currency) || 'Edit this budget'}
              </button>
            )}
            {onSaveChanges && (
              <button
                className="snapshot-action-btn"
                onClick={onSaveChanges}
              >
                Save Changes
              </button>
            )}
            {onExitSnapshot && (
              <button
                id="exit-snapshot-btn"
                className="snapshot-action-btn"
                onClick={onExitSnapshot}
              >
                {translate('backToMyBudget', currency)}
              </button>
            )}
          </div>
        )}
      </div>
      <table id="expense-table">
        <thead>
          <tr>
            <th id="table-amount">{translate('tableAmount', currency)}</th>
            <th id="table-category">{translate('tableCategory', currency)}</th>
            <th id="table-description">{translate('tableDescription', currency)}</th>
            <th id="table-action">{translate('tableAction', currency)}</th>
          </tr>
        </thead>
        <tbody id="expense-table-body">
          {expenses.filter(exp => exp.category !== 'Income').map(expense => {
            const categoryKey = `category${expense.category.replace(/\s+/g, '')}`;
            return (
              <tr key={expense._id}>
                <td>{formatCurrency(expense.amount, currency)}</td>
                <td>{translate(categoryKey, currency)}</td>
                <td>{expense.description || '-'}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(expense._id)}
                  >
                    {translate('deleteButton', currency)}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};

export default ExpenseList; 