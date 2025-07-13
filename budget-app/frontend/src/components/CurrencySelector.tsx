import React, { useEffect, useState, useRef } from 'react';
import { translate, Currency } from '../utils/translations';
import { ExpenseService } from '../services/expenseService';

interface CurrencySelectorProps {
  currency: Currency;
  template: string;
  income: number;
  userId: string | null;
  onCurrencyChanged: (currency: string) => void;
  onTemplateChanged: (template: string) => void;
  onIncomeChanged: (income: number) => void;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  currency,
  template,
  income,
  userId,
  onCurrencyChanged,
  onTemplateChanged,
  onIncomeChanged,
}) => {
  // Local state for income input
  const [incomeInput, setIncomeInput] = useState<string>(income ? String(income) : '');
  const [loading, setLoading] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync local input with prop
  useEffect(() => {
    setIncomeInput(income ? String(income) : '');
  }, [income]);

  // Handle currency change
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCurrencyChanged(e.target.value);
  };

  // Handle template change
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onTemplateChanged(e.target.value);
  };

  // Handle income input with debounce
  const handleIncomeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncomeInput(e.target.value);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      updateIncome(e.target.value);
    }, 1000);
  };

  // Update income in backend and parent state
  const updateIncome = async (value: string) => {
    if (!value) {
      onIncomeChanged(0);
      return;
    }
    if (isNaN(Number(value)) || parseFloat(value) < 0) {
      alert(translate('invalidIncome', currency));
      return;
    }
    const parsed = parseFloat(value);
    setLoading(true);
    try {
      if (!userId) throw new Error('User not authenticated');
      await ExpenseService.updateIncome(parsed, userId);
      onIncomeChanged(parsed);
    } catch (err: any) {
      alert(`${translate('failedIncome', currency)}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Main render
  return (
    <div className="controls-row">
      <div className="currency-section">
        <label htmlFor="currency" id="currency-label">{translate('currencyLabel', currency)}</label>
        <select id="currency" value={currency} onChange={handleCurrencyChange}>
          <option value="USD" id="currency-usd">{translate('currencyUSD', currency)}</option>
          <option value="EUR" id="currency-eur">{translate('currencyEUR', currency)}</option>
          <option value="SEK" id="currency-sek">{translate('currencySEK', currency)}</option>
        </select>
      </div>
      <div className="template-section">
        <label htmlFor="budget-template" id="template-label">{translate('templateLabel', currency)}</label>
        <select id="budget-template" value={template} onChange={handleTemplateChange}>
          <option value="50/30/20" id="template-50-30-20">{translate('template50_30_20', currency)}</option>
          <option value="70/20/10" id="template-70-20-10">{translate('template70_20_10', currency)}</option>
          <option value="Free" id="template-free">{translate('templateFree', currency)}</option>
        </select>
      </div>
      <div className="income-section">
        <label htmlFor="income" id="income-label">{translate('incomeLabel', currency)}</label>
        <input
          type="number"
          id="income"
          step="0.01"
          placeholder={translate('incomePlaceholder', currency)}
          value={incomeInput}
          onChange={handleIncomeInput}
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default CurrencySelector; 