import { translate, Currency } from '../utils/translations';
import { ExpenseService } from '../services/expenseService';

export class ExpenseForm {
  onExpenseAdded: (expense: any) => void;
  expenseForm: HTMLFormElement | null;
  userId: string | null;

  constructor(onExpenseAdded: (expense: any) => void) {
    this.onExpenseAdded = onExpenseAdded;
    this.expenseForm = document.getElementById('expense-form') as HTMLFormElement;
    this.userId = null;
    this.init();
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  init(): void {
    if (this.expenseForm) {
      this.expenseForm.addEventListener('submit', this.handleSubmit.bind(this));
    }
  }

  async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    const amount = parseFloat((document.getElementById('amount') as HTMLInputElement).value);
    const category = (document.getElementById('category') as HTMLInputElement).value;
    const description = (document.getElementById('description') as HTMLInputElement).value;
    
    if (!amount || amount <= 0) {
      alert(translate('invalidAmount'));
      return;
    }

    try {
      if (!this.userId) {
        throw new Error('User not authenticated');
      }
      const newExpense = await ExpenseService.addExpense({ amount, category, description }, this.userId);
      this.onExpenseAdded(newExpense);
      if (this.expenseForm) {
        this.expenseForm.reset();
      }
      (document.getElementById('category') as HTMLInputElement).value = category;
    } catch (err: any) {
      alert(`${translate('failedExpense')}: ${err.message}`);
    }
  }

  updateLanguage(currency: Currency): void {
    (document.getElementById('amount') as HTMLInputElement).placeholder = translate('amountPlaceholder', currency);
    (document.getElementById('category-fixed-monthly-costs') as HTMLElement).innerText = translate('categoryFixedMonthlyCosts', currency);
    (document.getElementById('category-variable-expenses') as HTMLElement).innerText = translate('categoryVariableExpenses', currency);
    (document.getElementById('category-savings') as HTMLElement).innerText = translate('categorySavings', currency);
    (document.getElementById('description') as HTMLInputElement).placeholder = translate('descriptionPlaceholder', currency);
    (document.getElementById('expense-button') as HTMLButtonElement).innerText = translate('expenseButton', currency);
  }
} 