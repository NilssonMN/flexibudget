import React, { useEffect, useRef, useState } from 'react';
import { ExpenseService } from './services/expenseService';
import BudgetOverview from './components/BudgetOverview';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList, { Expense as ExpenseListExpense } from './components/ExpenseList';
import CurrencySelector from './components/CurrencySelector';
import SnapshotManager from './components/SnapshotManager';
import { translate, Currency } from './utils/translations';
import { initializeAuth } from './services/firebase';
import './styles/global.css';
import './styles/components/budget.css';
import './styles/components/expense-form.css';
import './styles/components/expense-list.css';
import './styles/components/snapshot.css';
import { SnapshotService } from './services/snapshotService';

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

  // React state for all props
  const [expenses, setExpenses] = useState<ExpenseListExpense[]>([]);
  const [income, setIncome] = useState<number>(0);
  const [template, setTemplate] = useState<string>('50/30/20');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [userId, setUserId] = useState<string | null>(null);
  const [activeSnapshot, setActiveSnapshot] = useState<any | null>(null);
  const [mainBudget, setMainBudget] = useState<{ income: number; expenses: ExpenseListExpense[]; template: string } | null>(null);
  const [isEditingSnapshot, setIsEditingSnapshot] = useState(false);

  useEffect(() => {
    window.currentIncome = 0;
    window.currentExpenses = [];
    window.currentCurrency = localStorage.getItem('currency') || 'USD';
    window.currentTemplate = localStorage.getItem('budgetTemplate') || '50/30/20';

    setIncome(window.currentIncome);
    setExpenses(window.currentExpenses);
    setTemplate(window.currentTemplate);
    setCurrency(window.currentCurrency as Currency);

    init();
    // eslint-disable-next-line
  }, []);

  // App initialization and data loading
  async function init() {
    try {
      const authUser = await initializeAuth();
      user.current = authUser.uid;
      setUserId(authUser.uid);
      await loadInitialData();
      updateAllUI();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  async function loadInitialData() {
    window.currentExpenses = await ExpenseService.fetchExpenses(user.current!);
    window.currentIncome = await ExpenseService.fetchIncome(user.current!);
    setExpenses(Array.isArray(window.currentExpenses) ? window.currentExpenses : []);
    setIncome(window.currentIncome);
    setTemplate(window.currentTemplate!);
    setCurrency(window.currentCurrency as Currency);
    (document.getElementById('income') as HTMLInputElement).value = String(window.currentIncome ?? '');
  }

  // UI update and language helpers
  function updateAllUI() {
    const currencyVal = (window.currentCurrency as string) || 'USD';
    setExpenses(Array.isArray(window.currentExpenses) ? window.currentExpenses : []);
    setIncome(window.currentIncome ?? 0);
    setTemplate(window.currentTemplate || '50/30/20');
    setCurrency(currencyVal as Currency);
    updateLanguage(currencyVal as Currency);
  }

  function updateLanguage(currency: Currency) {
    (document.getElementById('app-title') as HTMLElement).innerText = translate('appTitle', currency);
    (document.getElementById('app-header') as HTMLElement).innerText = translate('appHeader', currency);
  }

  // Event handlers for app state changes
  function onExpenseAdded(newExpense: any) {
    setExpenses(prev => {
      const updated = [...prev, newExpense];
      window.currentExpenses = updated;
      // If editing a snapshot, update backend
      if (isEditingSnapshot && activeSnapshot && activeSnapshot._id) {
        const updatedSnapshot = {
          ...activeSnapshot,
          expenses: updated,
          income,
          template,
        };
        SnapshotService.updateSnapshot(activeSnapshot._id, updatedSnapshot);
        setActiveSnapshot(updatedSnapshot);
      }
      return updated;
    });
    updateAllUI();
  }

  function onExpenseDeleted(updatedExpenses: any[]) {
    setExpenses(updatedExpenses);
    window.currentExpenses = updatedExpenses;
    // If editing a snapshot, update backend
    if (isEditingSnapshot && activeSnapshot && activeSnapshot._id) {
      const updatedSnapshot = {
        ...activeSnapshot,
        expenses: updatedExpenses,
        income,
        template,
      };
      SnapshotService.updateSnapshot(activeSnapshot._id, updatedSnapshot);
      setActiveSnapshot(updatedSnapshot);
    }
    updateAllUI();
  }

  function onCurrencyChanged(currency: string) {
    window.currentCurrency = currency;
    setCurrency(currency as Currency);
    // If editing a snapshot, update backend
    if (isEditingSnapshot && activeSnapshot && activeSnapshot._id) {
      const updatedSnapshot = {
        ...activeSnapshot,
        currency,
        expenses,
        income,
        template,
      };
      SnapshotService.updateSnapshot(activeSnapshot._id, updatedSnapshot);
      setActiveSnapshot(updatedSnapshot);
    }
    updateAllUI();
  }

  function onTemplateChanged(template: string) {
    window.currentTemplate = template;
    setTemplate(template);
    // If editing a snapshot, update backend
    if (isEditingSnapshot && activeSnapshot && activeSnapshot._id) {
      const updatedSnapshot = {
        ...activeSnapshot,
        template,
        expenses,
        income,
      };
      SnapshotService.updateSnapshot(activeSnapshot._id, updatedSnapshot);
      setActiveSnapshot(updatedSnapshot);
    }
    updateAllUI();
  }

  function onIncomeChanged(newIncome: number) {
    window.currentIncome = newIncome;
    setIncome(newIncome);
    // If editing a snapshot, update backend
    if (isEditingSnapshot && activeSnapshot && activeSnapshot._id) {
      const updatedSnapshot = {
        ...activeSnapshot,
        income: newIncome,
        expenses,
        template,
      };
      SnapshotService.updateSnapshot(activeSnapshot._id, updatedSnapshot);
      setActiveSnapshot(updatedSnapshot);
    }
    updateAllUI();
  }

  function onSnapshotLoaded(snapshot: any) {
    if (!activeSnapshot) {
      setMainBudget({
        income,
        expenses,
        template,
      });
    }
    setIncome(snapshot.income ?? 0);
    setExpenses(Array.isArray(snapshot.expenses) ? snapshot.expenses : []);
    setTemplate(snapshot.template || '50/30/20');
    window.currentIncome = snapshot.income ?? 0;
    window.currentExpenses = Array.isArray(snapshot.expenses) ? snapshot.expenses : [];
    window.currentTemplate = snapshot.template || '50/30/20';
    setActiveSnapshot(snapshot);
    setIsEditingSnapshot(false); // Reset edit mode on load
    updateAllUI();
  }

  function onExitSnapshot() {
    // Restore main budget if it was saved before entering snapshot
    if (mainBudget) {
      setIncome(mainBudget.income);
      setExpenses(mainBudget.expenses);
      setTemplate(mainBudget.template);
      window.currentIncome = mainBudget.income;
      window.currentExpenses = mainBudget.expenses;
      window.currentTemplate = mainBudget.template;
      setMainBudget(null);
    }
    // Always clear active snapshot and update UI
    setActiveSnapshot(null);
    setIsEditingSnapshot(false); // Reset edit mode on exit
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
          <CurrencySelector
            currency={currency}
            template={template}
            income={income}
            userId={userId}
            onCurrencyChanged={onCurrencyChanged}
            onTemplateChanged={onTemplateChanged}
            onIncomeChanged={onIncomeChanged}
          />
          <ExpenseForm
            onExpenseAdded={onExpenseAdded}
            userId={userId}
            currency={currency}
          />
          <div className="income-display">
            <div id="income-display"></div>
          </div>
          <BudgetOverview
            expenses={expenses}
            income={income}
            template={template}
            currency={currency}
          />
          <ExpenseList
            expenses={expenses as ExpenseListExpense[]}
            currency={currency}
            onExpenseDeleted={onExpenseDeleted}
            activeSnapshot={activeSnapshot}
            onExitSnapshot={onExitSnapshot}
            onEditSnapshot={activeSnapshot && !isEditingSnapshot && activeSnapshot._id ? () => setIsEditingSnapshot(true) : undefined}
          />
          {activeSnapshot && isEditingSnapshot && (
            <div style={{ marginBottom: '12px', color: '#2563eb', fontWeight: 500 }}>
              {translate('editingSnapshotNotice', currency) || 'Editing snapshot. Changes are saved automatically.'}
            </div>
          )}
          <SnapshotManager
            userId={userId}
            currency={currency}
            income={income}
            expenses={expenses}
            template={template}
            onSnapshotLoaded={onSnapshotLoaded}
            onExitSnapshot={onExitSnapshot}
          />
        </div>
      </main>
    </div>
  );
};

export default App; 