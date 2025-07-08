import { ExpenseService } from './services/expenseService';
import { SnapshotService } from './services/snapshotService';
import { BudgetOverview } from './components/BudgetOverview.js';
import { ExpenseForm } from './components/ExpenseForm.js';
import { ExpenseList } from './components/ExpenseList.js';
import { SnapshotManager } from './components/SnapshotManager.js';
import { CurrencySelector } from './components/CurrencySelector.js';
import { translate } from './utils/translations';
import { initializeAuth, auth } from './services/firebase.js';

export class App {
  constructor() {
    // Global state
    window.currentIncome = 0;
    window.currentExpenses = [];
    window.currentCurrency = localStorage.getItem('currency') || 'USD';
    window.currentTemplate = localStorage.getItem('budgetTemplate') || '50/30/20';
    
    // User - will be set after authentication
    this.user = null;
    
    // Initialize components
    this.budgetOverview = new BudgetOverview();
    this.expenseForm = new ExpenseForm(this.onExpenseAdded.bind(this));
    this.expenseList = new ExpenseList(this.onExpenseDeleted.bind(this));
    this.snapshotManager = new SnapshotManager(
      this.user,
      this.onSnapshotLoaded.bind(this),
      this.onExitSnapshot.bind(this)
    );
    this.currencySelector = new CurrencySelector(
      this.onCurrencyChanged.bind(this),
      this.onTemplateChanged.bind(this)
    );
    
    // Set up global handlers
    ExpenseList.initGlobalHandlers();
    SnapshotManager.initGlobalHandlers();
    
    // Set global instances for HTML onclick handlers
    window.expenseListInstance = this.expenseList;
    window.snapshotManagerInstance = this.snapshotManager;
    
    this.init();
  }

  async init() {
    try {
      // Initialize Firebase authentication
      const user = await initializeAuth();
      this.user = user.uid; // Set user ID from Firebase auth
      
      // Update components with user ID
      this.snapshotManager.setUser(this.user);
      this.expenseForm.setUserId(this.user);
      this.currencySelector.setUserId(this.user);
      
      // Load initial data
      await this.loadInitialData();
      
      // Update UI
      this.updateAllUI();
      
      // Mark as loaded
      this.snapshotManager.initialDataLoaded = true;
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  async loadInitialData() {
    // Load expenses
    window.currentExpenses = await ExpenseService.fetchExpenses(this.user);
    
    // Load income
    window.currentIncome = await ExpenseService.fetchIncome(this.user);
    document.getElementById('income').value = window.currentIncome || '';
    
    // Load snapshots
    await this.snapshotManager.fetchSnapshots();
  }

  updateAllUI() {
    const currency = window.currentCurrency;
    
    // Update language for all components
    this.updateLanguage(currency);
    
    // Update component displays
    this.budgetOverview.updateBudgetOverview(
      window.currentExpenses,
      window.currentIncome,
      window.currentTemplate,
      currency
    );
    
    this.expenseList.updateExpenseList(window.currentExpenses, currency);
    this.currencySelector.updateIncomeDisplay(window.currentIncome, currency);
  }

  updateLanguage(currency) {
    // Update app title and header
    document.getElementById('app-title').innerText = translate('appTitle', currency);
    document.getElementById('app-header').innerText = translate('appHeader', currency);
    
    // Update component languages
    this.currencySelector.updateLanguage(currency);
    this.expenseForm.updateLanguage(currency);
    this.expenseList.updateLanguage(currency);
    this.snapshotManager.updateLanguage(currency);
  }

  // Event handlers
  onExpenseAdded(newExpense) {
    window.currentExpenses.push(newExpense);
    this.updateAllUI();
  }

  onExpenseDeleted(updatedExpenses) {
    window.currentExpenses = updatedExpenses;
    this.updateAllUI();
  }

  onCurrencyChanged(currency) {
    window.currentCurrency = currency;
    this.updateAllUI();
  }

  onTemplateChanged(template) {
    window.currentTemplate = template;
    this.budgetOverview.updateBudgetOverview(
      window.currentExpenses,
      window.currentIncome,
      template,
      window.currentCurrency
    );
  }

  onSnapshotLoaded() {
    this.updateAllUI();
  }

  onExitSnapshot() {
    this.updateAllUI();
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
}); 