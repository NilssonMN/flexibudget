// @ts-ignore  temporary solution while i migrate my codebase.
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from './firebase';

// Expense type definition
export interface Expense {
  category: string;
  amount: number;
  description?: string;
  userId?: string;
  _id?: string;
}

// Rate limiting variables
let lastRequestTime = 0;
let lastIncomeRequestTime = 0;
const MIN_REQUEST_INTERVAL = 50; 
const MIN_INCOME_REQUEST_INTERVAL = 100; 

export class ExpenseService {
  static validateExpense(expense: Expense): void {
    if (!expense.category || typeof expense.category !== 'string') {
      throw new Error('Category is required and must be a string');
    }
    if (!expense.amount || typeof expense.amount !== 'number' || expense.amount <= 0) {
      throw new Error('Amount is required and must be a positive number');
    }
    if (expense.amount > 1000000) {
      throw new Error('Amount cannot exceed 1,000,000');
    }
    if (expense.category.length > 50) {
      throw new Error('Category name is too long (max 50 characters)');
    }
    if (expense.description && expense.description.length > 200) {
      throw new Error('Description is too long (max 200 characters)');
    }
  }

  static checkRateLimit(): void {
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      throw new Error('Too many requests. Please wait a moment before trying again.');
    }
    lastRequestTime = now;
  }

  static async addExpense(expense: Expense, userId: string): Promise<Expense> {
    try {
      this.checkRateLimit();
      this.validateExpense(expense);
      const expenseWithUser: Expense = { ...expense, userId };
      const docRef = await addDoc(collection(db, 'expenses'), expenseWithUser);
      return { ...expenseWithUser, _id: docRef.id };
    } catch (err: any) {
      throw new Error(`Failed to add expense: ${err.message}`);
    }
  }

  static async fetchExpenses(userId: string): Promise<Expense[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'expenses'));
      const expenses: Expense[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.category !== 'Income' && data.userId === userId) {
          expenses.push({ ...(data as Expense), _id: docSnap.id });
        }
      });
      return expenses;
    } catch (err: any) {
      throw new Error(`Failed to load expenses: ${err.message}`);
    }
  }

  static async deleteExpense(id: string): Promise<void> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid expense ID');
      }
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err: any) {
      throw new Error(`Failed to delete expense: ${err.message}`);
    }
  }

  static async updateIncome(income: number, userId: string): Promise<void> {
    try {
      const now = Date.now();
      if (now - lastIncomeRequestTime < MIN_INCOME_REQUEST_INTERVAL) {
        throw new Error('Too many income updates. Please wait a moment before trying again.');
      }
      lastIncomeRequestTime = now;
      if (typeof income !== 'number' || income < 0) {
        throw new Error('Income must be a non-negative number');
      }
      if (income > 10000000) {
        throw new Error('Income cannot exceed 10,000,000');
      }
      await setDoc(doc(db, 'expenses', `income_${userId}`), { income, category: 'Income', amount: 0, userId });
    } catch (err: any) {
      throw new Error(`Failed to update income: ${err.message}`);
    }
  }

  static async fetchIncome(userId: string): Promise<number> {
    try {
      const docSnap = await getDoc(doc(db, 'expenses', `income_${userId}`));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.income || 0;
      }
      return 0;
    } catch (err: any) {
      throw new Error(`Failed to load income: ${err.message}`);
    }
  }
} 