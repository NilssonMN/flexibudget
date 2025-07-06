import { translate } from '../utils/translations.js';
import { ExpenseService } from '../services/expenseService.js';

export class ExpenseForm {
  constructor(onExpenseAdded) {
    this.onExpenseAdded = onExpenseAdded;
    this.expenseForm = document.getElementById('expense-form');
    this.init();
  }

  init() {
    this.expenseForm.addEventListener('submit', this.handleSubmit.bind(this));
  }

  async handleSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    
    if (!amount || amount <= 0) {
      alert(translate('invalidAmount'));
      return;
    }

    try {
      const newExpense = await ExpenseService.addExpense({ amount, category, description });
      this.onExpenseAdded(newExpense);
      this.expenseForm.reset();
      document.getElementById('category').value = category; // Keep the category selected
    } catch (err) {
      alert(`${translate('failedExpense')}: ${err.message}`);
    }
  }

  updateLanguage(currency) {
    document.getElementById('amount').placeholder = translate('amountPlaceholder', currency);
    document.getElementById('category-fixed-monthly-costs').innerText = translate('categoryFixedMonthlyCosts', currency);
    document.getElementById('category-variable-expenses').innerText = translate('categoryVariableExpenses', currency);
    document.getElementById('category-savings').innerText = translate('categorySavings', currency);
    document.getElementById('description').placeholder = translate('descriptionPlaceholder', currency);
    document.getElementById('expense-button').innerText = translate('expenseButton', currency);
  }
} 