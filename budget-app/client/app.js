// Initialize state
let income = 0;
let expenses = [];
let currency = localStorage.getItem('currency') || 'USD';
let language = currency === 'SEK' ? 'sv' : 'en';
let snapshots = [];
let template = localStorage.getItem('budgetTemplate') || '50/30/20';
const user = 'Nilsson';
let mainBudget = null; 
let activeSnapshot = null;
let initialDataLoaded = false; 

// Translations
const translations = {
  en: {
    appTitle: 'FlexiBudget',
    appHeader: 'FlexiBudget',
    currencyLabel: 'Currency',
    currencyUSD: 'Dollars ($)',
    currencyEUR: 'Euro (€)',
    currencySEK: 'Krona (Kr)',
    templateLabel: 'Budget Template',
    template50_30_20: '50/30/20 (Needs/Wants/Savings)',
    template70_20_10: '70/20/10 (Needs/Savings/Wants)',
    templateFree: 'Free Allocation',
    incomeLabel: 'Monthly Income',
    incomePlaceholder: 'Enter your income',
    incomeDisplay: 'Current Income',
    amountPlaceholder: 'Amount',
    categoryLabel: 'Category',
    categoryFixedMonthlyCosts: 'Fixed Monthly Costs',
    categoryVariableExpenses: 'Variable Expenses',
    categorySavings: 'Savings',
    descriptionPlaceholder: 'Description (optional)',
    expenseButton: 'Add Expense',
    budgetHeader: 'Budget Breakdown',
    saveSnapshotHeader: 'Save Budget',
    snapshotNamePlaceholder: 'Budget Name',
    saveSnapshotButton: 'Save Budget',
    snapshotListHeader: 'Saved Budgets',
    loadButton: 'Load',
    deleteSnapshotButton: 'Delete',
    fixedMonthlyCosts: 'Fixed Monthly Costs',
    variableExpenses: 'Variable Expenses',
    savings: 'Savings',
    expensesHeader: 'Expenses',
    tableAmount: 'Amount',
    tableCategory: 'Category',
    tableDescription: 'Description',
    tableAction: 'Action',
    deleteButton: 'Delete',
    invalidIncome: 'Please enter a positive number for income',
    failedIncome: 'Failed to update income',
    invalidAmount: 'Please enter a valid amount',
    failedExpense: 'Failed to add expense',
    failedLoadExpenses: 'Failed to load expenses',
    failedLoadIncome: 'Failed to load income',
    failedDelete: 'Failed to delete expense',
    invalidSnapshotName: 'Please enter a budget name',
    failedSaveSnapshot: 'Failed to save budget',
    failedLoadSnapshots: 'Failed to load saved budgets',
    failedLoadSnapshot: 'Failed to load budget',
    failedDeleteSnapshot: 'Failed to delete budget',
    of: 'of',
    exceedsLimitBy: 'exceeds limit by',
    remainingIncome: 'Remaining income',
    overBudget: 'Over budget',
    backToMyBudget: 'Back to Menu'
  },
  sv: {
    appTitle: 'FlexiBudget',
    appHeader: 'FlexiBudget',
    currencyLabel: 'Valuta',
    currencyUSD: 'Dollar ($)',
    currencyEUR: 'Euro (€)',
    currencySEK: 'Krona (Kr)',
    templateLabel: 'Budgetmall',
    template50_30_20: '50/30/20 (Behov/Nöjen/Sparande)',
    template70_20_10: '70/20/10 (Behov/Sparande/Nöjen)',
    templateFree: 'Fri Fördelning',
    incomeLabel: 'Månadsinkomst',
    incomePlaceholder: 'Ange din inkomst',
    incomeDisplay: 'Aktuell Inkomst',
    amountPlaceholder: 'Belopp',
    categoryLabel: 'Kategori',
    categoryFixedMonthlyCosts: 'Fasta månadskostnader',
    categoryVariableExpenses: 'Nöjen',
    categorySavings: 'Sparande',
    descriptionPlaceholder: 'Beskrivning (valfritt)',
    expenseButton: 'Lägg till Utgift',
    budgetHeader: 'Budgetfördelning',
    saveSnapshotHeader: 'Spara Budget',
    snapshotNamePlaceholder: 'Budgetnamn',
    saveSnapshotButton: 'Spara Budget',
    snapshotListHeader: 'Sparade Budgetar',
    loadButton: 'Ladda',
    deleteSnapshotButton: 'Radera',
    fixedMonthlyCosts: 'Fasta månadskostnader',
    variableExpenses: 'Nöjen',
    savings: 'Sparande',
    expensesHeader: 'Utgifter',
    tableAmount: 'Belopp',
    tableCategory: 'Kategori',
    tableDescription: 'Beskrivning',
    tableAction: 'Åtgärd',
    deleteButton: 'Radera',
    invalidIncome: 'Vänligen ange ett positivt tal för inkomst',
    failedIncome: 'Misslyckades att uppdatera inkomst',
    invalidAmount: 'Vänligen ange ett giltigt belopp',
    failedExpense: 'Misslyckades att lägga till utgift',
    failedLoadExpenses: 'Misslyckades att ladda utgifter',
    failedLoadIncome: 'Misslyckades att ladda inkomst',
    failedDelete: 'Misslyckades att radera utgift',
    invalidSnapshotName: 'Vänligen ange ett budgetnamn',
    failedSaveSnapshot: 'Misslyckades att spara budget',
    failedLoadSnapshots: 'Misslyckades att ladda sparade budgetar',
    failedLoadSnapshot: 'Misslyckades att ladda budget',
    failedDeleteSnapshot: 'Misslyckades att radera budget',
    of: 'av',
    exceedsLimitBy: 'överskrider gränsen med',
    remainingIncome: 'Återstående inkomst',
    overBudget: 'Över budget',
    backToMyBudget: 'Tillbaka till meny'
  },
};

// Get translated text
function translate(key) {
  return translations[language][key] || key;
}

// Currency formatter
const currencySymbols = {
  USD: '$',
  EUR: '€',
  SEK: 'Kr',
};

function formatCurrency(amount) {
  const locale = currency === 'SEK' ? 'sv-SE' : 'en-US';
  if (Number.isInteger(amount)) {
    return `${amount.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currencySymbols[currency]}`;
  }
  return `${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbols[currency]}`;
}

// Load data on page load
document.addEventListener('DOMContentLoaded', async () => {
  updateLanguage();
  document.getElementById('currency').value = currency;
  document.getElementById('budget-template').value = template;
  await fetchExpenses();
  await fetchIncome();
  await fetchSnapshots();
  // Save main budget after initial data load
  saveMainBudget();
  initialDataLoaded = true;
  document.getElementById('income').addEventListener('input', updateIncome);
  document.getElementById('save-snapshot-button').addEventListener('click', saveSnapshot);
  // Attach exit snapshot button event
  const btn = document.getElementById('exit-snapshot-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      if (mainBudget) {
        income = mainBudget.income;
        expenses = JSON.parse(JSON.stringify(mainBudget.expenses));
        template = mainBudget.template;
        document.getElementById('income').value = income || '';
        document.getElementById('budget-template').value = template;
        updateExpenseList();
        updateBudgetOverview();
        updateIncomeDisplay();
        activeSnapshot = null;
        showExitSnapshotButton(false);
      }
    });
  }
});

// Update language and UI text
function updateLanguage() {
  language = currency === 'SEK' ? 'sv' : 'en';
  const descriptionInput = document.getElementById('description');
  if (language === 'sv') {
    descriptionInput.classList.add('swedish');
  } else {
    descriptionInput.classList.remove('swedish');
  }
  document.getElementById('app-title').innerText = translate('appTitle');
  document.getElementById('app-header').innerText = translate('appHeader');
  document.getElementById('currency-label').innerText = translate('currencyLabel');
  document.getElementById('currency-usd').innerText = translate('currencyUSD');
  document.getElementById('currency-eur').innerText = translate('currencyEUR');
  document.getElementById('currency-sek').innerText = translate('currencySEK');
  document.getElementById('template-label').innerText = translate('templateLabel');
  document.getElementById('template-50-30-20').innerText = translate('template50_30_20');
  document.getElementById('template-70-20-10').innerText = translate('template70_20_10');
  document.getElementById('template-free').innerText = translate('templateFree');
  document.getElementById('income-label').innerText = translate('incomeLabel');
  document.getElementById('income').placeholder = translate('incomePlaceholder');
  document.getElementById('amount').placeholder = translate('amountPlaceholder');
  document.getElementById('category-fixed-monthly-costs').innerText = translate('categoryFixedMonthlyCosts');
  document.getElementById('category-variable-expenses').innerText = translate('categoryVariableExpenses');
  document.getElementById('category-savings').innerText = translate('categorySavings');
  document.getElementById('description').placeholder = translate('descriptionPlaceholder');
  document.getElementById('expense-button').innerText = translate('expenseButton');
  document.getElementById('budget-header').innerText = translate('budgetHeader');
  document.getElementById('save-snapshot-header').innerText = translate('saveSnapshotHeader');
  document.getElementById('snapshot-name').placeholder = translate('snapshotNamePlaceholder');
  document.getElementById('save-snapshot-button').innerText = translate('saveSnapshotButton');
  document.getElementById('snapshot-list-header').innerText = translate('snapshotListHeader');
  document.getElementById('expenses-header').innerText = translate('expensesHeader');
  document.getElementById('table-amount').innerText = translate('tableAmount');
  document.getElementById('table-category').innerText = translate('tableCategory');
  document.getElementById('table-description').innerText = translate('tableDescription');
  document.getElementById('table-action').innerText = translate('tableAction');
  updateExpenseList();
  updateBudgetOverview();
  updateSnapshotList();
  document.getElementById('exit-snapshot-btn').innerText = translate('backToMyBudget');
}

// Update currency
function updateCurrency() {
  currency = document.getElementById('currency').value;
  localStorage.setItem('currency', currency);
  updateLanguage();
}

// Update template
function updateTemplate() {
  template = document.getElementById('budget-template').value;
  localStorage.setItem('budgetTemplate', template);
  updateBudgetOverview();
}

// Update income on input
async function updateIncome() {
  const incomeInput = document.getElementById('income').value;
  console.log('Income input:', incomeInput);

  if (!incomeInput) {
    income = 0;
    updateBudgetOverview();
    updateIncomeDisplay();
    return;
  }

  if (isNaN(incomeInput) || parseFloat(incomeInput) < 0) {
    alert(translate('invalidIncome'));
    return;
  }

  income = parseFloat(incomeInput);
  console.log('Sending income:', income);
  try {
    const response = await fetch('http://localhost:5000/api/expenses/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ income }),
    });
    console.log('Save income response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error('Save income error:', response.status, text);
      throw new Error(`Failed to update income: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Income saved:', data);
    updateBudgetOverview();
    updateIncomeDisplay();
  } catch (err) {
    console.error('Error updating income:', err);
    alert(`${translate('failedIncome')}: ${err.message}`);
  }
}

// Update income display
function updateIncomeDisplay() {
  document.getElementById('income-display').innerHTML = `${translate('incomeDisplay')}: ${formatCurrency(income)}`;
}

// Save snapshot
async function saveSnapshot() {
  const snapshotName = document.getElementById('snapshot-name').value.trim();
  console.log('Saving snapshot:', snapshotName);

  if (!snapshotName) {
    alert(translate('invalidSnapshotName'));
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/expenses/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user,
        name: snapshotName,
        income,
        expenses: expenses.filter(exp => exp.category !== 'Income'),
        template
      }),
    });
    console.log('Save snapshot response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error('Save snapshot error:', response.status, text);
      throw new Error(`Failed to save snapshot: ${response.status} ${response.statusText}`);
    }
    const newSnapshot = await response.json();
    console.log('Snapshot saved:', newSnapshot);
    snapshots.push(newSnapshot);
    updateSnapshotList();
    document.getElementById('snapshot-name').value = '';
    alert('Budget sparad!');
  } catch (err) {
    console.error('Error saving snapshot:', err);
    alert(`${translate('failedSaveSnapshot')}: ${err.message}`);
  }
}

// Fetch snapshots
async function fetchSnapshots() {
  try {
    const response = await fetch(`http://localhost:5000/api/expenses/snapshots?user=${user}`);
    console.log('Fetch snapshots response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error('Fetch snapshots error:', response.status, text);
      throw new Error(`Failed to fetch snapshots: ${response.status} ${response.statusText}`);
    }
    snapshots = await response.json();
    console.log('Fetched snapshots:', snapshots);
    updateSnapshotList();
  } catch (err) {
    console.error('Error fetching snapshots:', err);
    alert(translate('failedLoadSnapshots'));
  }
}

// Load snapshot
async function loadSnapshot(id) {
  try {
    const response = await fetch(`http://localhost:5000/api/expenses/snapshots/${id}`);
    console.log('Load snapshot response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error('Load snapshot error:', response.status, text);
      throw new Error(`Failed to fetch snapshot: ${response.status} ${response.statusText}`);
    }
    const snapshot = await response.json();
    console.log('Loading snapshot:', snapshot);

    // --- Save main budget before loading snapshot ---
    if (!activeSnapshot && initialDataLoaded) {
      saveMainBudget();
    }
    activeSnapshot = true;
    showExitSnapshotButton(true);

    income = snapshot.income;
    document.getElementById('income').value = income || '';
    template = snapshot.template || '50/30/20';
    document.getElementById('budget-template').value = template;
    localStorage.setItem('budgetTemplate', template);

    expenses = snapshot.expenses.map(exp => ({
      _id: exp._id || new Date().toISOString(),
      category: exp.category,
      amount: exp.amount,
      description: exp.description
    }));
    expenses.push({ category: 'Income', income });

    updateExpenseList();
    updateBudgetOverview();
    updateIncomeDisplay();
  } catch (err) {
    console.error('Error loading snapshot:', err);
    alert(`${translate('failedLoadSnapshot')}: ${err.message}`);
  }
}

// Delete snapshot
async function deleteSnapshot(id) {
  try {
    const response = await fetch(`http://localhost:5000/api/expenses/snapshots/${id}`, {
      method: 'DELETE',
    });
    console.log('Delete snapshot response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error('Delete snapshot error:', response.status, text);
      throw new Error(`Failed to delete snapshot: ${response.status} ${response.statusText}`);
    }
    snapshots = snapshots.filter(snap => snap._id !== id);
    console.log('Snapshot deleted:', id);
    updateSnapshotList();
  } catch (err) {
    console.error('Error deleting snapshot:', err);
    alert(`${translate('failedDeleteSnapshot')}: ${err.message}`);
  }
}

// Update snapshot list
function updateSnapshotList() {
  const snapshotTable = document.getElementById('snapshot-table');
  snapshotTable.innerHTML = '';

  snapshots.forEach(snapshot => {
    const snapshotDiv = document.createElement('div');
    snapshotDiv.style.display = 'flex';
    snapshotDiv.style.gap = '10px';
    snapshotDiv.style.padding = '10px';
    snapshotDiv.innerHTML = `
      <span style="flex: 1">${snapshot.name}: ${formatCurrency(snapshot.income)} (${snapshot.template})</span>
      <button class="load-btn" onclick="loadSnapshot('${snapshot._id}')">${translate('loadButton')}</button>
      <button class="delete-snapshot-btn" onclick="deleteSnapshot('${snapshot._id}')">${translate('deleteSnapshotButton')}</button>
    `;
    snapshotTable.appendChild(snapshotDiv);
  });
}

// Add expense
document.getElementById('expense-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const description = document.getElementById('description').value;

  console.log('Adding expense:', { amount, category, description });

  if (!amount || amount <= 0) {
    console.log('Invalid amount:', amount);
    alert(translate('invalidAmount'));
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, category, description }),
    });
    console.log('Add expense response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error('Add expense error:', response.status, text);
      throw new Error(`Failed to add expense: ${response.status} ${response.statusText}`);
    }
    const newExpense = await response.json();
    console.log('Expense added:', newExpense);
    expenses.push(newExpense);
    updateExpenseList();
    updateBudgetOverview();
    document.getElementById('expense-form').reset();
  } catch (err) {
    console.error('Error adding expense:', err);
    alert(`${translate('failedExpense')}: ${err.message}`);
  }
});

// Fetch expenses
async function fetchExpenses() {
  try {
    const response = await fetch('http://localhost:5000/api/expenses');
    console.log('Fetch expenses response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error('Fetch expenses error:', response.status, text);
      throw new Error(`Failed to fetch expenses: ${response.status} ${response.statusText}`);
    }
    expenses = await response.json();
    console.log('Fetched expenses:', expenses);
    updateExpenseList();
    updateBudgetOverview();
  } catch (err) {
    console.error('Error fetching expenses:', err);
    alert(translate('failedLoadExpenses'));
  }
}

// Fetch income
async function fetchIncome() {
  try {
    const response = await fetch('http://localhost:5000/api/expenses');
    console.log('Fetch income response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error('Fetch income error:', response.status, text);
      throw new Error(`Failed to fetch expenses: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const incomeDoc = data.find((doc) => doc.category === 'Income');
    if (!incomeDoc) {
      console.log('No income document found, setting income to 0');
      income = 0;
    } else {
      income = incomeDoc.income;
    }
    document.getElementById('income').value = income || '';
    console.log('Fetched income:', income);
    updateBudgetOverview();
    updateIncomeDisplay();
  } catch (err) {
    console.error('Error fetching income:', err);
    alert(`${translate('failedLoadIncome')}: ${err.message}`);
    income = 0;
    updateBudgetOverview();
    updateIncomeDisplay();
  }
}

// Update expense list
function updateExpenseList() {
  const tableBody = document.getElementById('expense-table-body');
  tableBody.innerHTML = '';

  expenses
    .filter((exp) => exp.category !== 'Income')
    .forEach((expense) => {
      const categoryKey = `category${expense.category.replace(/\s+/g, '')}`;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatCurrency(expense.amount)}</td>
        <td>${translate(categoryKey)}</td>
        <td>${expense.description || '-'}</td>
        <td><button class="delete-btn" onclick="deleteExpense('${expense._id}')">${translate('deleteButton')}</button></td>
      `;
      tableBody.appendChild(row);
    });
}

// Delete expense
async function deleteExpense(id) {
  try {
    const response = await fetch(`http://localhost:5000/api/expenses/${id}`, {
      method: 'DELETE',
    });
    console.log('Delete expense response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error('Delete expense error:', response.status, text);
      throw new Error(`Failed to delete expense: ${response.status} ${response.statusText}`);
    }
    expenses = expenses.filter((exp) => exp._id !== id);
    console.log('Expense deleted:', id);
    updateExpenseList();
    updateBudgetOverview();
  } catch (err) {
    console.error('Error deleting expense:', err);
    alert(translate('failedDelete'));
  }
}

// Update budget overview
function updateBudgetOverview() {
  const fixedTotal = expenses
    .filter((exp) => exp.category === 'Fixed Monthly Costs')
    .reduce((sum, exp) => sum + exp.amount, 0);
  const variableTotal = expenses
    .filter((exp) => exp.category === 'Variable Expenses')
    .reduce((sum, exp) => sum + exp.amount, 0);
  const savingsTotal = expenses
    .filter((exp) => exp.category === 'Savings')
    .reduce((sum, exp) => sum + exp.amount, 0);

  const totalExpenses = fixedTotal + variableTotal + savingsTotal;
  const remainingIncome = income - totalExpenses;

  let fixedRow, variableRow, savingsRow, remainingRow;
  if (template === 'Free') {
    fixedRow = `<div class=\"budget-row\"><span class=\"icon\">🏠</span><span class=\"label\">${translate('fixedMonthlyCosts')}</span><span class=\"value\">${formatCurrency(fixedTotal)}</span></div>`;
    variableRow = `<div class=\"budget-row\"><span class=\"icon\">🎉</span><span class=\"label\">${translate('variableExpenses')}</span><span class=\"value\">${formatCurrency(variableTotal)}</span></div>`;
    savingsRow = `<div class=\"budget-row\"><span class=\"icon\">💰</span><span class=\"label\">${translate('savings')}</span><span class=\"value\">${formatCurrency(savingsTotal)}</span></div>`;
    remainingRow = `<div id=\"remaining-income\" class=\"budget-row${remainingIncome < 0 ? ' warning' : ''}\"><span class=\"icon\">🧮</span><span class=\"label\">${remainingIncome >= 0 ? translate('remainingIncome') : translate('overBudget')}</span><span class=\"value\">${formatCurrency(Math.abs(remainingIncome))}</span></div>`;
  } else {
    let targets;
    if (template === '50/30/20') {
      targets = {
        fixed: income * 0.5,
        variable: income * 0.3,
        savings: income * 0.2
      };
    } else {
      targets = {
        fixed: income * 0.7,
        variable: income * 0.1,
        savings: income * 0.2
      };
    }
    const fixedExcess = fixedTotal > targets.fixed ? fixedTotal - targets.fixed : 0;
    const variableExcess = variableTotal > targets.variable ? variableTotal - targets.variable : 0;
    const savingsExcess = savingsTotal > targets.savings ? savingsTotal - targets.savings : 0;
    fixedRow = `<div class=\"budget-row\"><span class=\"icon\">🏠</span><span class=\"label\">${translate('fixedMonthlyCosts')}</span><span class=\"value\">${formatCurrency(fixedTotal)}<span>(${fixedTotal} ${translate('of')} ${formatCurrency(targets.fixed)})${fixedExcess > 0 ? ` <span style='color:#F87171;'>${translate('exceedsLimitBy')} ${formatCurrency(fixedExcess)}</span>` : ''}</span></span></div>`;
    variableRow = `<div class=\"budget-row\"><span class=\"icon\">🎉</span><span class=\"label\">${translate('variableExpenses')}</span><span class=\"value\">${formatCurrency(variableTotal)}<span>(${variableTotal} ${translate('of')} ${formatCurrency(targets.variable)})${variableExcess > 0 ? ` <span style='color:#F87171;'>${translate('exceedsLimitBy')} ${formatCurrency(variableExcess)}</span>` : ''}</span></span></div>`;
    savingsRow = `<div class=\"budget-row\"><span class=\"icon\">💰</span><span class=\"label\">${translate('savings')}</span><span class=\"value\">${formatCurrency(savingsTotal)}<span>(${savingsTotal} ${translate('of')} ${formatCurrency(targets.savings)})${savingsExcess > 0 ? ` <span style='color:#F87171;'>${translate('exceedsLimitBy')} ${formatCurrency(savingsExcess)}</span>` : ''}</span></span></div>`;
    remainingRow = `<div id=\"remaining-income\" class=\"budget-row${remainingIncome < 0 ? ' warning' : ''}\"><span class=\"icon\">🧮</span><span class=\"label\">${remainingIncome >= 0 ? translate('remainingIncome') : translate('overBudget')}</span><span class=\"value\">${formatCurrency(Math.abs(remainingIncome))}</span></div>`;
  }

  // Render: remaining income at the top, then the three columns
  const budgetOverview = document.querySelector('.budget-overview-section');
  if (budgetOverview) {
    budgetOverview.innerHTML = `
      <h2 id=\"budget-header\">${translate('budgetHeader')}</h2>
      ${remainingRow}
      <div class=\"budget-cols\">
        ${fixedRow}
        ${variableRow}
        ${savingsRow}
      </div>
    `;
  }
}

//  main budget function 
function saveMainBudget() {
  mainBudget = {
    income,
    expenses: JSON.parse(JSON.stringify(expenses)),
    template
  };
}

// Show/hide exit snapshot button 
function showExitSnapshotButton(show) {
  const btn = document.getElementById('exit-snapshot-btn');
  if (btn) btn.style.display = show ? 'block' : 'none';
}