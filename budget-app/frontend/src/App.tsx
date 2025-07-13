import React, { useEffect, useRef, useState } from 'react';
import { ExpenseService } from './services/expenseService';
import BudgetOverview from './components/BudgetOverview';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList, { Expense as ExpenseListExpense } from './components/ExpenseList';
import CurrencySelector from './components/CurrencySelector';
import SnapshotManager from './components/SnapshotManager';
import { translate, Currency } from './utils/translations';
import { initializeAuth, getAnalytics } from './services/firebase';
import './styles/global.css';
import './styles/components/budget.css';
import './styles/components/expense-form.css';
import './styles/components/expense-list.css';
import './styles/components/snapshot.css';
import { SnapshotService } from './services/snapshotService';

const App: React.FC = () => {
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
    setIncome(Number(localStorage.getItem('income')) || 0);
    setExpenses([]);
    setTemplate(localStorage.getItem('budgetTemplate') || '50/30/20');
    setCurrency((localStorage.getItem('currency') as Currency) || 'USD');
    init();
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
    const fetchedExpenses = await ExpenseService.fetchExpenses(user.current!);
    const fetchedIncome = await ExpenseService.fetchIncome(user.current!);
    setExpenses(Array.isArray(fetchedExpenses) ? fetchedExpenses.map(e => ({ ...e, _id: e._id || '' })) : []);
    setIncome(fetchedIncome);
    setTemplate(localStorage.getItem('budgetTemplate') || '50/30/20');
    setCurrency((localStorage.getItem('currency') as Currency) || 'USD');
  }

  // UI update and language helpers
  function updateAllUI() {
    const currencyVal = (localStorage.getItem('currency') as string) || 'USD';
    setTemplate(localStorage.getItem('budgetTemplate') || '50/30/20');
    setCurrency(currencyVal as Currency);
    updateLanguage(currencyVal as Currency);
  }

  function updateLanguage(currency: Currency) {}

  // Event handlers for app state changes
  function onExpenseAdded(newExpense: any) {
    setExpenses(prev => {
      const updated = [...prev, newExpense];
      localStorage.setItem('expenses', JSON.stringify(updated));
      return updated;
    });
    updateAllUI();
  }

  function onExpenseDeleted(updatedExpenses: any[]) {
    setExpenses(updatedExpenses);
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
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
    setCurrency(currency as Currency);
    localStorage.setItem('currency', currency);
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
    setTemplate(template);
    localStorage.setItem('budgetTemplate', template);
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
    setIncome(newIncome);
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
    setActiveSnapshot(snapshot);
    setIsEditingSnapshot(false);
    updateAllUI();
  }

  function onExitSnapshot() {
    if (mainBudget) {
      setIncome(mainBudget.income);
      setExpenses(mainBudget.expenses);
      setTemplate(mainBudget.template);
      setMainBudget(null);
    }
    setActiveSnapshot(null);
    setIsEditingSnapshot(false);
    updateAllUI();
  }

  // Main App Layout
  return (
    <div>
      <main>
        <header className="header">
          <h1>{translate('appHeader', currency)}</h1>
        </header>
        <div className="main-content-column">
          <span style={{ display: 'none' }}>{translate('appTitle', currency)}</span>
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