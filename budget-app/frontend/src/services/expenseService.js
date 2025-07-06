import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from './firebase.js';

export class ExpenseService {
  // Add a new expense
  static async addExpense(expense) {
    try {
      const docRef = await addDoc(collection(db, 'expenses'), expense);
      return { ...expense, _id: docRef.id };
    } catch (err) {
      throw new Error(`Failed to add expense: ${err.message}`);
    }
  }

  // Fetch all expenses
  static async fetchExpenses() {
    try {
      const querySnapshot = await getDocs(collection(db, 'expenses'));
      const expenses = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.category !== 'Income') {
          expenses.push({ ...data, _id: docSnap.id });
        }
      });
      return expenses;
    } catch (err) {
      throw new Error(`Failed to load expenses: ${err.message}`);
    }
  }

  // Delete an expense
  static async deleteExpense(id) {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err) {
      throw new Error(`Failed to delete expense: ${err.message}`);
    }
  }

  // Update income
  static async updateIncome(income) {
    try {
      await setDoc(doc(db, 'expenses', 'income'), { income, category: 'Income', amount: 0 });
    } catch (err) {
      throw new Error(`Failed to update income: ${err.message}`);
    }
  }

  // Fetch income
  static async fetchIncome() {
    try {
      const docSnap = await getDoc(doc(db, 'expenses', 'income'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.income || 0;
      }
      return 0;
    } catch (err) {
      throw new Error(`Failed to load income: ${err.message}`);
    }
  }
} 