import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from './firebase.js';

// Rate limiting variables
let lastRequestTime = 0;
let lastIncomeRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
const MIN_INCOME_REQUEST_INTERVAL = 500; // 0.5 seconds between income requests

export class ExpenseService {
  // Validate expense data
  static validateExpense(expense) {
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

  // Rate limiting check
  static checkRateLimit() {
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      throw new Error('Too many requests. Please wait a moment before trying again.');
    }
    lastRequestTime = now;
  }

  // Add a new expense
  static async addExpense(expense, userId) {
    try {
      // Rate limiting
      this.checkRateLimit();
      
      // Data validation
      this.validateExpense(expense);
      
      // Add user ID to expense
      const expenseWithUser = { ...expense, userId };
      
      const docRef = await addDoc(collection(db, 'expenses'), expenseWithUser);
      return { ...expenseWithUser, _id: docRef.id };
    } catch (err) {
      throw new Error(`Failed to add expense: ${err.message}`);
    }
  }

  // Fetch all expenses
  static async fetchExpenses(userId) {
    try {
      const querySnapshot = await getDocs(collection(db, 'expenses'));
      const expenses = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.category !== 'Income' && data.userId === userId) {
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
      // Rate limiting
      this.checkRateLimit();
      
      // Validate ID
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid expense ID');
      }
      
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err) {
      throw new Error(`Failed to delete expense: ${err.message}`);
    }
  }

  // Update income
  static async updateIncome(income, userId) {
    try {
      // Rate limiting for income (less strict)
      const now = Date.now();
      if (now - lastIncomeRequestTime < MIN_INCOME_REQUEST_INTERVAL) {
        throw new Error('Too many income updates. Please wait a moment before trying again.');
      }
      lastIncomeRequestTime = now;
      
      // Validate income
      if (typeof income !== 'number' || income < 0) {
        throw new Error('Income must be a non-negative number');
      }
      if (income > 10000000) {
        throw new Error('Income cannot exceed 10,000,000');
      }
      
      await setDoc(doc(db, 'expenses', `income_${userId}`), { income, category: 'Income', amount: 0, userId });
    } catch (err) {
      throw new Error(`Failed to update income: ${err.message}`);
    }
  }

  // Fetch income
  static async fetchIncome(userId) {
    try {
      const docSnap = await getDoc(doc(db, 'expenses', `income_${userId}`));
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