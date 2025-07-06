import { translate } from '../utils/translations.js';
import { formatCurrency } from '../utils/currency.js';
import { ExpenseService } from '../services/expenseService.js';

export class ExpenseList {
  constructor(onExpenseDeleted) {
    this.onExpenseDeleted = onExpenseDeleted;
    this.expenses = [];
  }

  updateExpenseList(expenses, currency) {
    this.expenses = expenses;
    const tableBody = document.getElementById('expense-table-body');
    tableBody.innerHTML = '';

    expenses
      .filter((exp) => exp.category !== 'Income')
      .forEach((expense) => {
        const categoryKey = `category${expense.category.replace(/\s+/g, '')}`;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${formatCurrency(expense.amount, currency)}</td>
          <td>${translate(categoryKey, currency)}</td>
          <td>${expense.description || '-'}</td>
          <td><button class="delete-btn" onclick="window.deleteExpense('${expense._id}')">${translate('deleteButton', currency)}</button></td>
        `;
        tableBody.appendChild(row);
      });
  }

  async deleteExpense(id) {
    try {
      await ExpenseService.deleteExpense(id);
      this.expenses = this.expenses.filter((exp) => exp._id !== id);
      this.onExpenseDeleted(this.expenses);
    } catch (err) {
      alert(translate('failedDelete'));
    }
  }

  updateLanguage(currency) {
    document.getElementById('expenses-header').innerText = translate('expensesHeader', currency);
    document.getElementById('table-amount').innerText = translate('tableAmount', currency);
    document.getElementById('table-category').innerText = translate('tableCategory', currency);
    document.getElementById('table-description').innerText = translate('tableDescription', currency);
    document.getElementById('table-action').innerText = translate('tableAction', currency);
    
    // Update delete buttons text
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
      button.innerText = translate('deleteButton', currency);
    });
  }

  // Make deleteExpense available globally for HTML onclick handlers
  static initGlobalHandlers() {
    window.deleteExpense = (id) => {
      // This will be set by the main app
      if (window.expenseListInstance) {
        window.expenseListInstance.deleteExpense(id);
      }
    };
  }
} 