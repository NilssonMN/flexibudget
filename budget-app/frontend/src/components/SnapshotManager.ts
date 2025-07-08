declare global {
  interface Window {
    currentIncome?: number;
    currentExpenses?: any[];
    currentTemplate?: string;
    currentCurrency?: string;
    loadSnapshot?: (id: string) => void;
    deleteSnapshot?: (id: string) => void;
    snapshotManagerInstance?: any;
  }
}

import { translate, Currency } from '../utils/translations';
import { formatCurrency } from '../utils/currency';
import { SnapshotService } from '../services/snapshotService';

export interface SnapshotData {
  _id?: string;
  user: string;
  name: string;
  income: number;
  expenses: any[];
  template?: string;
}

export class SnapshotManager {
  user: string | null;
  onSnapshotLoaded: () => void;
  onExitSnapshot: () => void;
  snapshots: SnapshotData[];
  activeSnapshot: boolean | null;
  mainBudget: any;
  initialDataLoaded: boolean;

  constructor(user: string | null, onSnapshotLoaded: () => void, onExitSnapshot: () => void) {
    this.user = user;
    this.onSnapshotLoaded = onSnapshotLoaded;
    this.onExitSnapshot = onExitSnapshot;
    this.snapshots = [];
    this.activeSnapshot = null;
    this.mainBudget = null;
    this.initialDataLoaded = false;
    this.init();
  }

  setUser(userId: string): void {
    this.user = userId;
  }

  init(): void {
    document.getElementById('save-snapshot-button')?.addEventListener('click', this.saveSnapshot.bind(this));
    const exitBtn = document.getElementById('exit-snapshot-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', this.exitSnapshot.bind(this));
    }
  }

  async saveSnapshot(): Promise<void> {
    const snapshotName = (document.getElementById('snapshot-name') as HTMLInputElement).value.trim();
    if (!snapshotName) {
      alert(translate('invalidSnapshotName'));
      return;
    }
    try {
      const snapshotData: SnapshotData = {
        user: this.user!,
        name: snapshotName,
        income: window.currentIncome || 0,
        expenses: (window.currentExpenses || []).filter((exp: any) => exp.category !== 'Income'),
        template: window.currentTemplate || '50/30/20'
      };
      const newSnapshot = await SnapshotService.saveSnapshot(snapshotData);
      this.snapshots.push(newSnapshot);
      this.updateSnapshotList();
      (document.getElementById('snapshot-name') as HTMLInputElement).value = '';
      alert((window.currentCurrency || 'SEK') === 'SEK' ? 'Budget sparad!' : 'Budget saved!');
    } catch (err: any) {
      alert(`${translate('failedSaveSnapshot')}: ${err.message}`);
    }
  }

  async fetchSnapshots(): Promise<void> {
    try {
      this.snapshots = await SnapshotService.fetchSnapshots(this.user!);
      this.updateSnapshotList();
    } catch (err) {
      alert(translate('failedLoadSnapshots'));
    }
  }

  async loadSnapshot(id: string): Promise<void> {
    try {
      const snapshot = await SnapshotService.loadSnapshot(id);
      if (!this.activeSnapshot && this.initialDataLoaded) {
        this.saveMainBudget();
      }
      this.activeSnapshot = true;
      this.showExitSnapshotButton(true);
      window.currentIncome = snapshot?.income ?? 0;
      window.currentTemplate = snapshot?.template || '50/30/20';
      window.currentExpenses = (snapshot?.expenses || []).map((exp: any) => ({
        _id: exp._id || new Date().toISOString(),
        category: exp.category,
        amount: exp.amount,
        description: exp.description
      }));
      window.currentExpenses.push({ category: 'Income', income: snapshot?.income ?? 0 });
      (document.getElementById('income') as HTMLInputElement).value = snapshot?.income?.toString() || '';
      (document.getElementById('budget-template') as HTMLInputElement).value = window.currentTemplate || '';
      localStorage.setItem('budgetTemplate', window.currentTemplate || '');
      this.onSnapshotLoaded();
    } catch (err: any) {
      alert(`${translate('failedLoadSnapshot')}: ${err.message}`);
    }
  }

  async deleteSnapshot(id: string): Promise<void> {
    try {
      await SnapshotService.deleteSnapshot(id);
      this.snapshots = this.snapshots.filter(snap => snap._id !== id);
      this.updateSnapshotList();
    } catch (err: any) {
      alert(`${translate('failedDeleteSnapshot')}: ${err.message}`);
    }
  }

  updateSnapshotList(): void {
    const snapshotTable = document.getElementById('snapshot-table') as HTMLElement;
    snapshotTable.innerHTML = '';
    this.snapshots.forEach(snapshot => {
      const snapshotDiv = document.createElement('div');
      snapshotDiv.style.display = 'flex';
      snapshotDiv.style.gap = '10px';
      snapshotDiv.style.padding = '10px';
      snapshotDiv.innerHTML = `
        <span style="flex: 1">${snapshot.name}: ${formatCurrency(snapshot.income, (window.currentCurrency || 'SEK') as Currency)} (${snapshot.template || '50/30/20'})</span>
        <button class="load-btn" onclick="window.loadSnapshot('${snapshot._id}')">${translate('loadButton', (window.currentCurrency || 'SEK') as Currency)}</button>
        <button class="delete-snapshot-btn" onclick="window.deleteSnapshot('${snapshot._id}')">${translate('deleteSnapshotButton', (window.currentCurrency || 'SEK') as Currency)}</button>
      `;
      snapshotTable.appendChild(snapshotDiv);
    });
  }

  exitSnapshot(): void {
    if (this.mainBudget) {
      window.currentIncome = this.mainBudget.income;
      window.currentExpenses = JSON.parse(JSON.stringify(this.mainBudget.expenses));
      window.currentTemplate = this.mainBudget.template;
      (document.getElementById('income') as HTMLInputElement).value = (window.currentIncome ?? '').toString();
      (document.getElementById('budget-template') as HTMLInputElement).value = window.currentTemplate || '';
      this.onExitSnapshot();
      this.activeSnapshot = null;
      this.showExitSnapshotButton(false);
    }
  }

  saveMainBudget(): void {
    this.mainBudget = {
      income: window.currentIncome ?? 0,
      expenses: JSON.parse(JSON.stringify(window.currentExpenses ?? [])),
      template: window.currentTemplate || '50/30/20'
    };
  }

  showExitSnapshotButton(show: boolean): void {
    const btn = document.getElementById('exit-snapshot-btn');
    if (btn) btn.style.display = show ? 'block' : 'none';
  }

  updateLanguage(currency: Currency): void {
    (document.getElementById('save-snapshot-header') as HTMLElement).innerText = translate('saveSnapshotHeader', currency);
    (document.getElementById('snapshot-name') as HTMLInputElement).placeholder = translate('snapshotNamePlaceholder', currency);
    (document.getElementById('save-snapshot-button') as HTMLButtonElement).innerText = translate('saveSnapshotButton', currency);
    (document.getElementById('snapshot-list-header') as HTMLElement).innerText = translate('snapshotListHeader', currency);
    (document.getElementById('exit-snapshot-btn') as HTMLButtonElement).innerText = translate('backToMyBudget', currency);
    this.updateSnapshotList();
  }

  // Make snapshot functions available globally for HTML onclick handlers
  static initGlobalHandlers(): void {
    (window as any).loadSnapshot = (id: string) => {
      if ((window as any).snapshotManagerInstance) {
        (window as any).snapshotManagerInstance.loadSnapshot(id);
      }
    };
    (window as any).deleteSnapshot = (id: string) => {
      if ((window as any).snapshotManagerInstance) {
        (window as any).snapshotManagerInstance.deleteSnapshot(id);
      }
    };
  }
} 