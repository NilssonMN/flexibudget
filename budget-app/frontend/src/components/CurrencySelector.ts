import { translate, Currency } from '../utils/translations';
import { ExpenseService } from '../services/expenseService';

export class CurrencySelector {
  onCurrencyChanged: (currency: string) => void;
  onTemplateChanged: (template: string) => void;
  currency: string;
  template: string;
  userId: string | null;
  incomeTimeout: ReturnType<typeof setTimeout> | null;

  constructor(onCurrencyChanged: (currency: string) => void, onTemplateChanged: (template: string) => void) {
    this.onCurrencyChanged = onCurrencyChanged;
    this.onTemplateChanged = onTemplateChanged;
    this.currency = localStorage.getItem('currency') || 'USD';
    this.template = localStorage.getItem('budgetTemplate') || '50/30/20';
    this.userId = null;
    this.incomeTimeout = null;
    this.init();
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  init() {
    // Set up currency selector
    (document.getElementById('currency') as HTMLSelectElement).addEventListener('change', this.updateCurrency.bind(this));
    
    // Set up template selector
    (document.getElementById('budget-template') as HTMLSelectElement).addEventListener('change', this.updateTemplate.bind(this));
    
    // Set up income input with debounce
    this.incomeTimeout = null;
    (document.getElementById('income') as HTMLInputElement).addEventListener('input', this.debouncedUpdateIncome.bind(this));
    
    // Set initial values
    (document.getElementById('currency') as HTMLSelectElement).value = this.currency;
    (document.getElementById('budget-template') as HTMLSelectElement).value = this.template;
  }

  debouncedUpdateIncome() {
    // Clear existing timeout
    if (this.incomeTimeout) {
      clearTimeout(this.incomeTimeout);
    }
    
    // Set new timeout - only update after user stops typing for 1 second
    this.incomeTimeout = setTimeout(() => {
      this.updateIncome();
    }, 1000);
  }

  updateCurrency() {
    this.currency = (document.getElementById('currency') as HTMLSelectElement).value;
    localStorage.setItem('currency', this.currency);
    window.currentCurrency = this.currency;
    this.onCurrencyChanged(this.currency);
  }

  updateTemplate() {
    this.template = (document.getElementById('budget-template') as HTMLSelectElement).value;
    localStorage.setItem('budgetTemplate', this.template);
    window.currentTemplate = this.template;
    this.onTemplateChanged(this.template);
  }

  async updateIncome() {
    const incomeInput = (document.getElementById('income') as HTMLInputElement).value;
    if (!incomeInput) {
      window.currentIncome = 0;
      this.onCurrencyChanged(this.currency);
      return;
    }
    
    if (isNaN(Number(incomeInput)) || parseFloat(incomeInput) < 0) {
      alert(translate('invalidIncome', this.currency as Currency));
      return;
    }
    
    window.currentIncome = parseFloat(incomeInput);
    
    try {
      if (!this.userId) {
        throw new Error('User not authenticated');
      }
      await ExpenseService.updateIncome(window.currentIncome, this.userId);
      this.onCurrencyChanged(this.currency);
    } catch (err: any) {
      alert(`${translate('failedIncome', this.currency as Currency)}: ${err.message}`);
    }
  }

  updateLanguage(currency: Currency) {
    (document.getElementById('currency-label') as HTMLElement).innerText = translate('currencyLabel', currency);
    (document.getElementById('currency-usd') as HTMLElement).innerText = translate('currencyUSD', currency);
    (document.getElementById('currency-eur') as HTMLElement).innerText = translate('currencyEUR', currency);
    (document.getElementById('currency-sek') as HTMLElement).innerText = translate('currencySEK', currency);
    (document.getElementById('template-label') as HTMLElement).innerText = translate('templateLabel', currency);
    (document.getElementById('template-50-30-20') as HTMLElement).innerText = translate('template50_30_20', currency);
    (document.getElementById('template-70-20-10') as HTMLElement).innerText = translate('template70_20_10', currency);
    (document.getElementById('template-free') as HTMLElement).innerText = translate('templateFree', currency);
    (document.getElementById('income-label') as HTMLElement).innerText = translate('incomeLabel', currency);
    (document.getElementById('income') as HTMLInputElement).placeholder = translate('incomePlaceholder', currency);
  }

  updateIncomeDisplay(income: number, currency: Currency) {
    (document.getElementById('income-display') as HTMLElement).innerHTML = `${translate('incomeDisplay', currency)}: ${this.formatCurrency(income, currency)}`;
  }

  formatCurrency(amount: number, currency: string) {
    const currencySymbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      SEK: 'Kr',
    };
    
    const locale = currency === 'SEK' ? 'sv-SE' : 'en-US';
    if (Number.isInteger(amount)) {
      return `${amount.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currencySymbols[currency]}`;
    }
    return `${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbols[currency]}`;
  }

  getCurrency() {
    return this.currency;
  }

  getTemplate() {
    return this.template;
  }
} 