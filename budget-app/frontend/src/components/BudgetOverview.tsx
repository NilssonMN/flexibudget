import React from 'react';
import { translate, Currency } from '../utils/translations';
import { formatCurrency } from '../utils/currency';

export interface Expense {
  _id?: string;
  amount: number;
  category: string;
  description?: string;
}

interface BudgetOverviewProps {
  expenses: Expense[];
  income: number;
  template: string;
  currency: Currency;
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({ expenses, income, template, currency }) => {
  // Calculate totals and targets
  const fixedTotal = expenses.filter(exp => exp.category === 'Fixed Monthly Costs').reduce((sum, exp) => sum + exp.amount, 0);
  const variableTotal = expenses.filter(exp => exp.category === 'Variable Expenses').reduce((sum, exp) => sum + exp.amount, 0);
  const savingsTotal = expenses.filter(exp => exp.category === 'Savings').reduce((sum, exp) => sum + exp.amount, 0);
  const totalExpenses = fixedTotal + variableTotal + savingsTotal;
  const remainingIncome = income - totalExpenses;

  let targets = { fixed: 0, variable: 0, savings: 0 };
  if (template === '50/30/20') {
    targets = { fixed: income * 0.5, variable: income * 0.3, savings: income * 0.2 };
  } else if (template === '70/20/10') {
    targets = { fixed: income * 0.7, variable: income * 0.1, savings: income * 0.2 };
  }

  return (
    <section className="budget-overview-section">
      <h2 id="budget-header">{translate('budgetHeader', currency)}</h2>
      <div id="remaining-income" className={`budget-row${remainingIncome < 0 ? ' warning' : ''}`}>
        <span className="icon">🧮</span>
        <span className="label">
          {remainingIncome >= 0 ? translate('remainingIncome', currency) : translate('overBudget', currency)}
        </span>
        <span className="value">{formatCurrency(Math.abs(remainingIncome), currency)}</span>
      </div>
      <div className="budget-cols">
        <div className="budget-row">
          <span className="icon">🏠</span>
          <span className="label">{translate('fixedMonthlyCosts', currency)}</span>
          <span className="value">
            {formatCurrency(fixedTotal, currency)}
            {template !== 'Free' && (
              <span>
                ({fixedTotal} {translate('of', currency)} {formatCurrency(targets.fixed, currency)})
                {fixedTotal > targets.fixed && (
                  <span className="budget-warning-text">
                    {` ${translate('exceedsLimitBy', currency)} ${formatCurrency(fixedTotal - targets.fixed, currency)}`}
                  </span>
                )}
              </span>
            )}
          </span>
        </div>
        <div className="budget-row">
          <span className="icon">🎉</span>
          <span className="label">{translate('variableExpenses', currency)}</span>
          <span className="value">
            {formatCurrency(variableTotal, currency)}
            {template !== 'Free' && (
              <span>
                ({variableTotal} {translate('of', currency)} {formatCurrency(targets.variable, currency)})
                {variableTotal > targets.variable && (
                  <span className="budget-warning-text">
                    {` ${translate('exceedsLimitBy', currency)} ${formatCurrency(variableTotal - targets.variable, currency)}`}
                  </span>
                )}
              </span>
            )}
          </span>
        </div>
        <div className="budget-row">
          <span className="icon">💰</span>
          <span className="label">{translate('savings', currency)}</span>
          <span className="value">
            {formatCurrency(savingsTotal, currency)}
            {template !== 'Free' && (
              <span>
                ({savingsTotal} {translate('of', currency)} {formatCurrency(targets.savings, currency)})
                {savingsTotal > targets.savings && (
                  <span className="budget-warning-text">
                    {` ${translate('exceedsLimitBy', currency)} ${formatCurrency(savingsTotal - targets.savings, currency)}`}
                  </span>
                )}
              </span>
            )}
          </span>
        </div>
      </div>
    </section>
  );
};

export default BudgetOverview; 