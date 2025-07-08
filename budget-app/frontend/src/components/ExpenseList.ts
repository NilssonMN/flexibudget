import { translate, Currency } from '../utils/translations';
import { formatCurrency } from '../utils/currency';
import { ExpenseService } from '../services/expenseService';

export interface Expense {
  _id: string;
  amount: number;
  category: string;
  description?: string;
}

export class ExpenseList {
  onExpenseDeleted: (expenses: Expense[]) => void;
  expenses: Expense[];

  constructor(onExpenseDeleted: (expenses: Expense[]) => void) {
    this.onExpenseDeleted = onExpenseDeleted;
    this.expenses = [];
  }

  updateExpenseList(expenses: Expense[], currency: Currency): void {
    this.expenses = expenses;
    const tableBody = document.getElementById('expense-table-body') as HTMLElement;
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

  async deleteExpense(id: string): Promise<void> {
    const prevExpenses = [...this.expenses];
    this.expenses = this.expenses.filter((exp) => exp._id !== id);
    this.onExpenseDeleted(this.expenses);

    try {
      await ExpenseService.deleteExpense(id);
    } catch (err) {
      // Rollback: restore the previous state if delete fails
      this.expenses = prevExpenses;
      this.onExpenseDeleted(this.expenses);
    }
  }

  updateLanguage(currency: Currency): void {
    (document.getElementById('expenses-header') as HTMLElement).innerText = translate('expensesHeader', currency);
    (document.getElementById('table-amount') as HTMLElement).innerText = translate('tableAmount', currency);
    (document.getElementById('table-category') as HTMLElement).innerText = translate('tableCategory', currency);
    (document.getElementById('table-description') as HTMLElement).innerText = translate('tableDescription', currency);
    (document.getElementById('table-action') as HTMLElement).innerText = translate('tableAction', currency);
    
    // Update delete buttons text
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
      (button as HTMLButtonElement).innerText = translate('deleteButton', currency);
    });
  }

  // Make deleteExpense available globally for HTML onclick handlers
  static initGlobalHandlers(): void {
    (window as any).deleteExpense = (id: string) => {
      // This will be set by the main app
      if ((window as any).expenseListInstance) {
        (window as any).expenseListInstance.deleteExpense(id);
      }
    };
  }
} 