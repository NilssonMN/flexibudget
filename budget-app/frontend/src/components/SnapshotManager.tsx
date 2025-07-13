import React, { useEffect, useState } from 'react';
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

interface SnapshotManagerProps {
  userId: string | null;
  currency: Currency;
  income: number;
  expenses: any[];
  template: string;
  onSnapshotLoaded: (snapshot: SnapshotData) => void;
  onExitSnapshot: () => void;
}

const SnapshotManager: React.FC<SnapshotManagerProps> = ({
  userId,
  currency,
  income,
  expenses,
  template,
  onSnapshotLoaded,
  onExitSnapshot,
}) => {
  // State for snapshots and active snapshot
  const [snapshots, setSnapshots] = useState<SnapshotData[]>([]);
  const [activeSnapshot, setActiveSnapshot] = useState<SnapshotData | null>(null);
  const [snapshotName, setSnapshotName] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch snapshots on mount or when userId changes
  useEffect(() => {
    if (userId) fetchSnapshots();
    // eslint-disable-next-line
  }, [userId]);

  // Save a new snapshot
  const saveSnapshot = async () => {
    if (!snapshotName.trim()) {
      alert(translate('invalidSnapshotName', currency));
      return;
    }
    setLoading(true);
    try {
      const snapshotData: SnapshotData = {
        user: userId!,
        name: snapshotName.trim(),
        income,
        expenses: expenses.filter((exp: any) => exp.category !== 'Income'),
        template: template || '50/30/20',
      };
      const newSnapshot = await SnapshotService.saveSnapshot(snapshotData);
      setSnapshots(prev => [...prev, newSnapshot]);
      setSnapshotName('');
      alert(currency === 'SEK' ? 'Budget sparad!' : 'Budget saved!');
    } catch (err: any) {
      alert(`${translate('failedSaveSnapshot', currency)}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all snapshots
  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const snaps = await SnapshotService.fetchSnapshots(userId!);
      setSnapshots(snaps);
    } catch (err) {
      alert(translate('failedLoadSnapshots', currency));
    } finally {
      setLoading(false);
    }
  };

  // Load a snapshot
  const loadSnapshot = async (id: string) => {
    setLoading(true);
    try {
      const snapshot = await SnapshotService.loadSnapshot(id);
      if (!snapshot) {
        setActiveSnapshot(null);
        return;
      }
      // Attach the _id to the loaded snapshot
      const snapshotWithId = { ...snapshot, _id: id };
      setActiveSnapshot(snapshotWithId);
      onSnapshotLoaded(snapshotWithId);
    } catch (err: any) {
      alert(`${translate('failedLoadSnapshot', currency)}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete a snapshot
  const deleteSnapshot = async (id: string) => {
    setLoading(true);
    try {
      await SnapshotService.deleteSnapshot(id);
      setSnapshots(prev => prev.filter(snap => snap._id !== id));
    } catch (err: any) {
      alert(`${translate('failedDeleteSnapshot', currency)}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Exit snapshot view
  const exitSnapshot = () => {
    setActiveSnapshot(null);
    onExitSnapshot();
  };

  // Main render
  return (
    <div className="snapshot-wrapper">
      <section className="save-snapshot-section">
        <h2 id="save-snapshot-header">{translate('saveSnapshotHeader', currency)}</h2>
        <input
          type="text"
          id="snapshot-name"
          placeholder={translate('snapshotNamePlaceholder', currency)}
          value={snapshotName}
          onChange={e => setSnapshotName(e.target.value)}
          disabled={loading}
        />
        <button
          id="save-snapshot-button"
          onClick={saveSnapshot}
          disabled={loading || !userId}
        >
          {translate('saveSnapshotButton', currency)}
        </button>
      </section>
      <section className="snapshot-list-section">
        <h2 id="snapshot-list-header">{translate('snapshotListHeader', currency)}</h2>
        <div id="snapshot-table">
          {snapshots.map(snapshot => (
            <div key={snapshot._id} style={{ display: 'flex', gap: '10px', padding: '10px' }}>
              <span style={{ flex: 1 }}>
                {snapshot.name}: {formatCurrency(snapshot.income, currency)} ({snapshot.template || '50/30/20'})
              </span>
              <button
                className="load-btn"
                onClick={() => loadSnapshot(snapshot._id!)}
                disabled={loading}
              >
                {translate('loadButton', currency)}
              </button>
              <button
                className="delete-snapshot-btn"
                onClick={() => deleteSnapshot(snapshot._id!)}
                disabled={loading}
              >
                {translate('deleteSnapshotButton', currency)}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SnapshotManager; 