import { ExpenseService } from './services/expenseService';
import { SnapshotService } from './services/snapshotService';
// @ts-ignore
import { BudgetOverview } from './components/BudgetOverview.js';
// @ts-ignore
import { ExpenseForm } from './components/ExpenseForm.js';
// @ts-ignore
import { ExpenseList } from './components/ExpenseList.js';
// @ts-ignore
import { SnapshotManager } from './components/SnapshotManager.js';
// @ts-ignore
import { CurrencySelector } from './components/CurrencySelector.js';
import { translate } from './utils/translations';
import { initializeAuth, auth } from './services/firebase';

// Define types for global state
declare global {
  interface Window {
    currentIncome: number;
    currentExpenses: any[];
    currentCurrency: string;
    currentTemplate: string;
    expenseListInstance: ExpenseList;
    snapshotManagerInstance: SnapshotManager;
  }
}

export class App {
  user: string | null;
  budgetOverview: BudgetOverview;
  expenseForm: ExpenseForm;
  expenseList: ExpenseList;
  snapshotManager: SnapshotManager;
  currencySelector: CurrencySelector;

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

  async init(): Promise<void> {
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

  async loadInitialData(): Promise<void> {
    // Load expenses
    window.currentExpenses = await ExpenseService.fetchExpenses(this.user!);
    
    // Load income
    window.currentIncome = await ExpenseService.fetchIncome(this.user!);
    (document.getElementById('income') as HTMLInputElement).value = String(window.currentIncome || '');
    
    // Load snapshots
    await this.snapshotManager.fetchSnapshots();
  }

  updateAllUI(): void {
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

  updateLanguage(currency: string): void {
    // Update app title and header
    (document.getElementById('app-title') as HTMLElement).innerText = translate('appTitle', currency as any);
    (document.getElementById('app-header') as HTMLElement).innerText = translate('appHeader', currency as any);
    
    // Update component languages
    this.currencySelector.updateLanguage(currency);
    this.expenseForm.updateLanguage(currency);
    this.expenseList.updateLanguage(currency);
    this.snapshotManager.updateLanguage(currency);
  }

  // Event handlers
  onExpenseAdded(newExpense: any): void {
    window.currentExpenses.push(newExpense);
    this.updateAllUI();
  }

  onExpenseDeleted(updatedExpenses: any[]): void {
    window.currentExpenses = updatedExpenses;
    this.updateAllUI();
  }

  onCurrencyChanged(currency: string): void {
    window.currentCurrency = currency;
    this.updateAllUI();
  }

  onTemplateChanged(template: string): void {
    window.currentTemplate = template;
    this.budgetOverview.updateBudgetOverview(
      window.currentExpenses,
      window.currentIncome,
      template,
      window.currentCurrency
    );
  }

  onSnapshotLoaded(): void {
    this.updateAllUI();
  }

  onExitSnapshot(): void {
    this.updateAllUI();
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
}); 