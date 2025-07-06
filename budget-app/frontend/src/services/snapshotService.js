import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, query, where } from "firebase/firestore";
import { db } from './firebase.js';

// Rate limiting variables
let lastSnapshotRequestTime = 0;
const MIN_SNAPSHOT_REQUEST_INTERVAL = 2000; // 2 seconds between snapshot operations

export class SnapshotService {
  // Validate snapshot data
  static validateSnapshot(snapshotData) {
    if (!snapshotData.user || typeof snapshotData.user !== 'string') {
      throw new Error('User is required and must be a string');
    }
    if (!snapshotData.name || typeof snapshotData.name !== 'string') {
      throw new Error('Snapshot name is required and must be a string');
    }
    if (snapshotData.name.length > 100) {
      throw new Error('Snapshot name is too long (max 100 characters)');
    }
    if (!snapshotData.expenses || !Array.isArray(snapshotData.expenses)) {
      throw new Error('Expenses must be an array');
    }
    if (snapshotData.expenses.length > 1000) {
      throw new Error('Too many expenses in snapshot (max 1000)');
    }
    if (typeof snapshotData.income !== 'number' || snapshotData.income < 0) {
      throw new Error('Income must be a non-negative number');
    }
    if (snapshotData.income > 10000000) {
      throw new Error('Income cannot exceed 10,000,000');
    }
  }

  // Rate limiting check for snapshots
  static checkSnapshotRateLimit() {
    const now = Date.now();
    if (now - lastSnapshotRequestTime < MIN_SNAPSHOT_REQUEST_INTERVAL) {
      throw new Error('Too many snapshot operations. Please wait a moment before trying again.');
    }
    lastSnapshotRequestTime = now;
  }

  // Save a new snapshot
  static async saveSnapshot(snapshotData) {
    try {
      // Rate limiting
      this.checkSnapshotRateLimit();
      
      // Data validation
      this.validateSnapshot(snapshotData);
      
      const docRef = await addDoc(collection(db, 'snapshots'), snapshotData);
      return { ...snapshotData, _id: docRef.id };
    } catch (err) {
      throw new Error(`Failed to save snapshot: ${err.message}`);
    }
  }

  // Fetch snapshots for a user
  static async fetchSnapshots(user) {
    try {
      const q = query(collection(db, 'snapshots'), where('user', '==', user));
      const querySnapshot = await getDocs(q);
      const snapshots = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        snapshots.push({ _id: docSnap.id, ...data });
      });
      return snapshots;
    } catch (err) {
      throw new Error(`Failed to load snapshots: ${err.message}`);
    }
  }

  // Load a specific snapshot
  static async loadSnapshot(id) {
    try {
      const docSnap = await getDoc(doc(db, 'snapshots', id));
      if (!docSnap.exists()) {
        throw new Error('Snapshot not found');
      }
      return docSnap.data();
    } catch (err) {
      throw new Error(`Failed to load snapshot: ${err.message}`);
    }
  }

  // Delete a snapshot
  static async deleteSnapshot(id) {
    try {
      // Rate limiting
      this.checkSnapshotRateLimit();
      
      // Validate ID
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid snapshot ID');
      }
      
      await deleteDoc(doc(db, 'snapshots', id));
    } catch (err) {
      throw new Error(`Failed to delete snapshot: ${err.message}`);
    }
  }
} 