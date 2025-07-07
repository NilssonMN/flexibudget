import { translate } from '../utils/translations.js';
import { formatCurrency } from '../utils/currency';

export class BudgetOverview {
  constructor() {
    this.updateBudgetOverview = this.updateBudgetOverview.bind(this);
  }

  updateBudgetOverview(expenses, income, template, currency) {
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
      fixedRow = `<div class="budget-row"><span class="icon">🏠</span><span class="label">${translate('fixedMonthlyCosts', currency)}</span><span class="value">${formatCurrency(fixedTotal, currency)}</span></div>`;
      variableRow = `<div class="budget-row"><span class="icon">🎉</span><span class="label">${translate('variableExpenses', currency)}</span><span class="value">${formatCurrency(variableTotal, currency)}</span></div>`;
      savingsRow = `<div class="budget-row"><span class="icon">💰</span><span class="label">${translate('savings', currency)}</span><span class="value">${formatCurrency(savingsTotal, currency)}</span></div>`;
      remainingRow = `<div id="remaining-income" class="budget-row${remainingIncome < 0 ? ' warning' : ''}"><span class="icon">🧮</span><span class="label">${remainingIncome >= 0 ? translate('remainingIncome', currency) : translate('overBudget', currency)}</span><span class="value">${formatCurrency(Math.abs(remainingIncome), currency)}</span></div>`;
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
      
      fixedRow = `<div class="budget-row"><span class="icon">🏠</span><span class="label">${translate('fixedMonthlyCosts', currency)}</span><span class="value">${formatCurrency(fixedTotal, currency)}<span>(${fixedTotal} ${translate('of', currency)} ${formatCurrency(targets.fixed, currency)})${fixedExcess > 0 ? ` <span style='color:#F87171;'>${translate('exceedsLimitBy', currency)} ${formatCurrency(fixedExcess, currency)}</span>` : ''}</span></span></div>`;
      variableRow = `<div class="budget-row"><span class="icon">🎉</span><span class="label">${translate('variableExpenses', currency)}</span><span class="value">${formatCurrency(variableTotal, currency)}<span>(${variableTotal} ${translate('of', currency)} ${formatCurrency(targets.variable, currency)})${variableExcess > 0 ? ` <span style='color:#F87171;'>${translate('exceedsLimitBy', currency)} ${formatCurrency(variableExcess, currency)}</span>` : ''}</span></span></div>`;
      savingsRow = `<div class="budget-row"><span class="icon">💰</span><span class="label">${translate('savings', currency)}</span><span class="value">${formatCurrency(savingsTotal, currency)}<span>(${savingsTotal} ${translate('of', currency)} ${formatCurrency(targets.savings, currency)})${savingsExcess > 0 ? ` <span style='color:#F87171;'>${translate('exceedsLimitBy', currency)} ${formatCurrency(savingsExcess, currency)}</span>` : ''}</span></span></div>`;
      remainingRow = `<div id="remaining-income" class="budget-row${remainingIncome < 0 ? ' warning' : ''}"><span class="icon">🧮</span><span class="label">${remainingIncome >= 0 ? translate('remainingIncome', currency) : translate('overBudget', currency)}</span><span class="value">${formatCurrency(Math.abs(remainingIncome), currency)}</span></div>`;
    }

    const budgetOverview = document.querySelector('.budget-overview-section');
    if (budgetOverview) {
      budgetOverview.innerHTML = `
        <h2 id="budget-header">${translate('budgetHeader', currency)}</h2>
        ${remainingRow}
        <div class="budget-cols">
          ${fixedRow}
          ${variableRow}
          ${savingsRow}
        </div>
      `;
    }
  }
} 