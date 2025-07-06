import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, query, where } from "firebase/firestore";
import { db } from './firebase.js';

export class SnapshotService {
  // Save a new snapshot
  static async saveSnapshot(snapshotData) {
    try {
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
      await deleteDoc(doc(db, 'snapshots', id));
    } catch (err) {
      throw new Error(`Failed to delete snapshot: ${err.message}`);
    }
  }
} 