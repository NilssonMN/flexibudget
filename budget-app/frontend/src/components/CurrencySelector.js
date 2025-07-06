import { translate } from '../utils/translations.js';
import { ExpenseService } from '../services/expenseService.js';

export class CurrencySelector {
  constructor(onCurrencyChanged, onTemplateChanged) {
    this.onCurrencyChanged = onCurrencyChanged;
    this.onTemplateChanged = onTemplateChanged;
    this.currency = localStorage.getItem('currency') || 'USD';
    this.template = localStorage.getItem('budgetTemplate') || '50/30/20';
    this.init();
  }

  init() {
    // Set up currency selector
    document.getElementById('currency').addEventListener('change', this.updateCurrency.bind(this));
    
    // Set up template selector
    document.getElementById('budget-template').addEventListener('change', this.updateTemplate.bind(this));
    
    // Set up income input
    document.getElementById('income').addEventListener('input', this.updateIncome.bind(this));
    
    // Set initial values
    document.getElementById('currency').value = this.currency;
    document.getElementById('budget-template').value = this.template;
  }

  updateCurrency() {
    this.currency = document.getElementById('currency').value;
    localStorage.setItem('currency', this.currency);
    window.currentCurrency = this.currency;
    this.onCurrencyChanged(this.currency);
  }

  updateTemplate() {
    this.template = document.getElementById('budget-template').value;
    localStorage.setItem('budgetTemplate', this.template);
    window.currentTemplate = this.template;
    this.onTemplateChanged(this.template);
  }

  async updateIncome() {
    const incomeInput = document.getElementById('income').value;
    if (!incomeInput) {
      window.currentIncome = 0;
      this.onCurrencyChanged(this.currency);
      return;
    }
    
    if (isNaN(incomeInput) || parseFloat(incomeInput) < 0) {
      alert(translate('invalidIncome', this.currency));
      return;
    }
    
    window.currentIncome = parseFloat(incomeInput);
    
    try {
      await ExpenseService.updateIncome(window.currentIncome);
      this.onCurrencyChanged(this.currency);
    } catch (err) {
      alert(`${translate('failedIncome', this.currency)}: ${err.message}`);
    }
  }

  updateLanguage(currency) {
    document.getElementById('currency-label').innerText = translate('currencyLabel', currency);
    document.getElementById('currency-usd').innerText = translate('currencyUSD', currency);
    document.getElementById('currency-eur').innerText = translate('currencyEUR', currency);
    document.getElementById('currency-sek').innerText = translate('currencySEK', currency);
    document.getElementById('template-label').innerText = translate('templateLabel', currency);
    document.getElementById('template-50-30-20').innerText = translate('template50_30_20', currency);
    document.getElementById('template-70-20-10').innerText = translate('template70_20_10', currency);
    document.getElementById('template-free').innerText = translate('templateFree', currency);
    document.getElementById('income-label').innerText = translate('incomeLabel', currency);
    document.getElementById('income').placeholder = translate('incomePlaceholder', currency);
  }

  updateIncomeDisplay(income, currency) {
    document.getElementById('income-display').innerHTML = `${translate('incomeDisplay', currency)}: ${this.formatCurrency(income, currency)}`;
  }

  formatCurrency(amount, currency) {
    const currencySymbols = {
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