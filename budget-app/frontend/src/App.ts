import { ExpenseService } from './services/expenseService';
import { BudgetOverview } from './components/BudgetOverview';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { SnapshotManager } from './components/SnapshotManager';
import { CurrencySelector } from './components/CurrencySelector';
import { translate, Currency } from './utils/translations';
import { initializeAuth } from './services/firebase';

declare global {
  interface Window {
    currentIncome?: number;
    currentExpenses?: any[];
    currentCurrency?: string;
    currentTemplate?: string;
    expenseListInstance?: any;
    snapshotManagerInstance?: any;
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
      this.snapshotManager.setUser(this.user!);
      this.expenseForm.setUserId(this.user!);
      this.currencySelector.setUserId(this.user!);

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
    (document.getElementById('income') as HTMLInputElement).value = String(window.currentIncome ?? '');

    // Load snapshots
    await this.snapshotManager.fetchSnapshots();
  }

  updateAllUI(): void {
    const currency = (window.currentCurrency as string) || 'USD';

    // Update language for all components
    this.updateLanguage(currency as Currency);

    // Update component displays
    this.budgetOverview.updateBudgetOverview(
      window.currentExpenses ?? [],
      window.currentIncome ?? 0,
      window.currentTemplate || '50/30/20',
      currency as Currency
    );

    this.expenseList.updateExpenseList(window.currentExpenses ?? [], currency as Currency);
    this.currencySelector.updateIncomeDisplay(window.currentIncome ?? 0, currency as Currency);
  }

  updateLanguage(currency: Currency): void {
    // Update app title and header
    (document.getElementById('app-title') as HTMLElement).innerText = translate('appTitle', currency);
    (document.getElementById('app-header') as HTMLElement).innerText = translate('appHeader', currency);

    // Update component languages
    this.currencySelector.updateLanguage(currency);
    this.expenseForm.updateLanguage(currency);
    this.expenseList.updateLanguage(currency);
    this.snapshotManager.updateLanguage(currency);
  }

  // Event handlers
  onExpenseAdded(newExpense: any): void {
    (window.currentExpenses ?? []).push(newExpense);
    this.updateAllUI();
  }

  onExpenseDeleted(updatedExpenses: any[]): void {
    window.currentExpenses = updatedExpenses ?? [];
    this.updateAllUI();
  }

  onCurrencyChanged(currency: string): void {
    window.currentCurrency = currency;
    this.updateAllUI();
  }

  onTemplateChanged(template: string): void {
    window.currentTemplate = template;
    this.budgetOverview.updateBudgetOverview(
      window.currentExpenses ?? [],
      window.currentIncome ?? 0,
      template,
      (window.currentCurrency as string || 'USD') as Currency
    );
  }

  onSnapshotLoaded(): void {
    this.updateAllUI();
  }

  onExitSnapshot(): void {
    this.updateAllUI();
  }
} 