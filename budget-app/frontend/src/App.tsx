import React, { useEffect, useRef } from 'react';
import { ExpenseService } from './services/expenseService';
import { BudgetOverview } from './components/BudgetOverview';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { SnapshotManager } from './components/SnapshotManager';
import { CurrencySelector } from './components/CurrencySelector';
import { translate, Currency } from './utils/translations';
import { initializeAuth } from './services/firebase';
import './styles/global.css';
import './styles/components/budget.css';
import './styles/components/expense-form.css';
import './styles/components/expense-list.css';
import './styles/components/snapshot.css';

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

const App: React.FC = () => {
  // Class instance refs for legacy logic
  const user = useRef<string | null>(null);
  const budgetOverview = useRef<BudgetOverview | null>(null);
  const expenseForm = useRef<ExpenseForm | null>(null);
  const expenseList = useRef<ExpenseList | null>(null);
  const snapshotManager = useRef<SnapshotManager | null>(null);
  const currencySelector = useRef<CurrencySelector | null>(null);

  useEffect(() => {
    window.currentIncome = 0;
    window.currentExpenses = [];
    window.currentCurrency = localStorage.getItem('currency') || 'USD';
    window.currentTemplate = localStorage.getItem('budgetTemplate') || '50/30/20';

    budgetOverview.current = new BudgetOverview();
    expenseForm.current = new ExpenseForm(onExpenseAdded);
    expenseList.current = new ExpenseList(onExpenseDeleted);
    snapshotManager.current = new SnapshotManager(
      user.current,
      onSnapshotLoaded,
      onExitSnapshot
    );
    currencySelector.current = new CurrencySelector(
      onCurrencyChanged,
      onTemplateChanged
    );

    ExpenseList.initGlobalHandlers();
    SnapshotManager.initGlobalHandlers();

    window.expenseListInstance = expenseList.current;
    window.snapshotManagerInstance = snapshotManager.current;

    init();
    // eslint-disable-next-line
  }, []);

  // App initialization and data loading
  async function init() {
    try {
      const authUser = await initializeAuth();
      user.current = authUser.uid;
      snapshotManager.current?.setUser(user.current!);
      expenseForm.current?.setUserId(user.current!);
      currencySelector.current?.setUserId(user.current!);
      await loadInitialData();
      updateAllUI();
      if (snapshotManager.current) snapshotManager.current.initialDataLoaded = true;
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  async function loadInitialData() {
    window.currentExpenses = await ExpenseService.fetchExpenses(user.current!);
    window.currentIncome = await ExpenseService.fetchIncome(user.current!);
    (document.getElementById('income') as HTMLInputElement).value = String(window.currentIncome ?? '');
    await snapshotManager.current?.fetchSnapshots();
  }

  // UI update and language helpers
  function updateAllUI() {
    const currency = (window.currentCurrency as string) || 'USD';
    updateLanguage(currency as Currency);
    budgetOverview.current?.updateBudgetOverview(
      window.currentExpenses ?? [],
      window.currentIncome ?? 0,
      window.currentTemplate || '50/30/20',
      currency as Currency
    );
    expenseList.current?.updateExpenseList(window.currentExpenses ?? [], currency as Currency);
    currencySelector.current?.updateIncomeDisplay(window.currentIncome ?? 0, currency as Currency);
  }

  function updateLanguage(currency: Currency) {
    (document.getElementById('app-title') as HTMLElement).innerText = translate('appTitle', currency);
    (document.getElementById('app-header') as HTMLElement).innerText = translate('appHeader', currency);
    currencySelector.current?.updateLanguage(currency);
    expenseForm.current?.updateLanguage(currency);
    expenseList.current?.updateLanguage(currency);
    snapshotManager.current?.updateLanguage(currency);
  }

  // Event handlers for app state changes
  function onExpenseAdded(newExpense: any) {
    (window.currentExpenses ?? []).push(newExpense);
    updateAllUI();
  }

  function onExpenseDeleted(updatedExpenses: any[]) {
    window.currentExpenses = updatedExpenses ?? [];
    updateAllUI();
  }

  function onCurrencyChanged(currency: string) {
    window.currentCurrency = currency;
    updateAllUI();
  }

  function onTemplateChanged(template: string) {
    window.currentTemplate = template;
    budgetOverview.current?.updateBudgetOverview(
      window.currentExpenses ?? [],
      window.currentIncome ?? 0,
      template,
      (window.currentCurrency as string || 'USD') as Currency
    );
  }

  function onSnapshotLoaded() {
    updateAllUI();
  }

  function onExitSnapshot() {
    updateAllUI();
  }

  // Main App Layout
  return (
    <div>
      <main>
        <header className="header">
          <h1 id="app-header"></h1>
        </header>
        <div className="main-content-column">
          <div className="controls-row">
            <div className="currency-section">
              <label htmlFor="currency" id="currency-label"></label>
              <select id="currency">
                <option value="USD" id="currency-usd"></option>
                <option value="EUR" id="currency-eur"></option>
                <option value="SEK" id="currency-sek"></option>
              </select>
            </div>
            <div className="template-section">
              <label htmlFor="budget-template" id="template-label"></label>
              <select id="budget-template">
                <option value="50/30/20" id="template-50-30-20"></option>
                <option value="70/20/10" id="template-70-20-10"></option>
                <option value="Free" id="template-free"></option>
              </select>
            </div>
            <div className="income-section">
              <label htmlFor="income" id="income-label"></label>
              <input type="number" id="income" step="0.01" />
            </div>
          </div>
          <section className="expense-form-section">
            <form id="expense-form">
              <select id="category" required>
                <option value="Fixed Monthly Costs" id="category-fixed-monthly-costs"></option>
                <option value="Variable Expenses" id="category-variable-expenses"></option>
                <option value="Savings" id="category-savings"></option>
              </select>
              <input type="number" id="amount" required step="0.01" />
              <input type="text" id="description" />
              <button type="submit" id="expense-button"></button>
            </form>
          </section>
          <div className="income-display">
            <div id="income-display"></div>
          </div>
          <section className="budget-overview-section">
            <h2 id="budget-header"></h2>
            <div id="fixed-monthly-costs"></div>
            <div id="variable-expenses"></div>
            <div id="savings"></div>
            <div id="remaining-income"></div>
          </section>
        </div>
      </main>
      <div className="snapshot-wrapper">
        <section className="save-snapshot-section">
          <h2 id="save-snapshot-header"></h2>
          <input type="text" id="snapshot-name" placeholder="Budget Name" />
          <button id="save-snapshot-button"></button>
        </section>
        <section className="snapshot-list-section">
          <h2 id="snapshot-list-header"></h2>
          <div id="snapshot-table"></div>
        </section>
      </div>
      <section className="expense-list-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <h2 id="expenses-header" style={{ margin: 0 }}></h2>
          <button id="exit-snapshot-btn" style={{ display: 'none', height: '32px' }}>Tillbaka till meny</button>
        </div>
        <table id="expense-table">
          <thead>
            <tr>
              <th id="table-amount"></th>
              <th id="table-category"></th>
              <th id="table-description"></th>
              <th id="table-action"></th>
            </tr>
          </thead>
          <tbody id="expense-table-body"></tbody>
        </table>
      </section>
    </div>
  );
};

export default App; 