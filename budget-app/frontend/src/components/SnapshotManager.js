import { translate } from '../utils/translations';
import { formatCurrency } from '../utils/currency';
import { SnapshotService } from '../services/snapshotService.js';

export class SnapshotManager {
  constructor(user, onSnapshotLoaded, onExitSnapshot) {
    this.user = user;
    this.onSnapshotLoaded = onSnapshotLoaded;
    this.onExitSnapshot = onExitSnapshot;
    this.snapshots = [];
    this.activeSnapshot = null;
    this.mainBudget = null;
    this.initialDataLoaded = false;
    this.init();
  }

  setUser(userId) {
    this.user = userId;
  }

  init() {
    // Set up save snapshot button
    document.getElementById('save-snapshot-button').addEventListener('click', this.saveSnapshot.bind(this));
    
    // Set up exit snapshot button
    const exitBtn = document.getElementById('exit-snapshot-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', this.exitSnapshot.bind(this));
    }
  }

  async saveSnapshot() {
    const snapshotName = document.getElementById('snapshot-name').value.trim();
    if (!snapshotName) {
      alert(translate('invalidSnapshotName'));
      return;
    }

    try {
      const snapshotData = {
        user: this.user,
        name: snapshotName,
        income: window.currentIncome || 0,
        expenses: (window.currentExpenses || []).filter(exp => exp.category !== 'Income'),
        template: window.currentTemplate || '50/30/20'
      };

      const newSnapshot = await SnapshotService.saveSnapshot(snapshotData);
      this.snapshots.push(newSnapshot);
      this.updateSnapshotList();
      document.getElementById('snapshot-name').value = '';
      alert(window.currentCurrency === 'SEK' ? 'Budget sparad!' : 'Budget saved!');
    } catch (err) {
      alert(`${translate('failedSaveSnapshot')}: ${err.message}`);
    }
  }

  async fetchSnapshots() {
    try {
      this.snapshots = await SnapshotService.fetchSnapshots(this.user);
      this.updateSnapshotList();
    } catch (err) {
      alert(translate('failedLoadSnapshots'));
    }
  }

  async loadSnapshot(id) {
    try {
      const snapshot = await SnapshotService.loadSnapshot(id);
      
      if (!this.activeSnapshot && this.initialDataLoaded) {
        this.saveMainBudget();
      }
      
      this.activeSnapshot = true;
      this.showExitSnapshotButton(true);
      
      // Update global state
      window.currentIncome = snapshot.income;
      window.currentTemplate = snapshot.template || '50/30/20';
      window.currentExpenses = snapshot.expenses.map(exp => ({
        _id: exp._id || new Date().toISOString(),
        category: exp.category,
        amount: exp.amount,
        description: exp.description
      }));
      
      // Add income to expenses array
      window.currentExpenses.push({ category: 'Income', income: snapshot.income });
      
      // Update UI
      document.getElementById('income').value = snapshot.income || '';
      document.getElementById('budget-template').value = window.currentTemplate;
      localStorage.setItem('budgetTemplate', window.currentTemplate);
      
      this.onSnapshotLoaded();
    } catch (err) {
      alert(`${translate('failedLoadSnapshot')}: ${err.message}`);
    }
  }

  async deleteSnapshot(id) {
    try {
      await SnapshotService.deleteSnapshot(id);
      this.snapshots = this.snapshots.filter(snap => snap._id !== id);
      this.updateSnapshotList();
    } catch (err) {
      alert(`${translate('failedDeleteSnapshot')}: ${err.message}`);
    }
  }

  updateSnapshotList() {
    const snapshotTable = document.getElementById('snapshot-table');
    snapshotTable.innerHTML = '';

    this.snapshots.forEach(snapshot => {
      const snapshotDiv = document.createElement('div');
      snapshotDiv.style.display = 'flex';
      snapshotDiv.style.gap = '10px';
      snapshotDiv.style.padding = '10px';
      snapshotDiv.innerHTML = `
        <span style="flex: 1">${snapshot.name}: ${formatCurrency(snapshot.income, window.currentCurrency)} (${snapshot.template})</span>
        <button class="load-btn" onclick="window.loadSnapshot('${snapshot._id}')">${translate('loadButton', window.currentCurrency)}</button>
        <button class="delete-snapshot-btn" onclick="window.deleteSnapshot('${snapshot._id}')">${translate('deleteSnapshotButton', window.currentCurrency)}</button>
      `;
      snapshotTable.appendChild(snapshotDiv);
    });
  }

  exitSnapshot() {
    if (this.mainBudget) {
      window.currentIncome = this.mainBudget.income;
      window.currentExpenses = JSON.parse(JSON.stringify(this.mainBudget.expenses));
      window.currentTemplate = this.mainBudget.template;
      
      document.getElementById('income').value = window.currentIncome || '';
      document.getElementById('budget-template').value = window.currentTemplate;
      
      this.onExitSnapshot();
      this.activeSnapshot = null;
      this.showExitSnapshotButton(false);
    }
  }

  saveMainBudget() {
    this.mainBudget = {
      income: window.currentIncome,
      expenses: JSON.parse(JSON.stringify(window.currentExpenses)),
      template: window.currentTemplate
    };
  }

  showExitSnapshotButton(show) {
    const btn = document.getElementById('exit-snapshot-btn');
    if (btn) btn.style.display = show ? 'block' : 'none';
  }

  updateLanguage(currency) {
    document.getElementById('save-snapshot-header').innerText = translate('saveSnapshotHeader', currency);
    document.getElementById('snapshot-name').placeholder = translate('snapshotNamePlaceholder', currency);
    document.getElementById('save-snapshot-button').innerText = translate('saveSnapshotButton', currency);
    document.getElementById('snapshot-list-header').innerText = translate('snapshotListHeader', currency);
    document.getElementById('exit-snapshot-btn').innerText = translate('backToMyBudget', currency);
    this.updateSnapshotList();
  }

  // Make snapshot functions available globally for HTML onclick handlers
  static initGlobalHandlers() {
    window.loadSnapshot = (id) => {
      if (window.snapshotManagerInstance) {
        window.snapshotManagerInstance.loadSnapshot(id);
      }
    };
    
    window.deleteSnapshot = (id) => {
      if (window.snapshotManagerInstance) {
        window.snapshotManagerInstance.deleteSnapshot(id);
      }
    };
  }
} 