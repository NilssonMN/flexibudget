import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, User } from "firebase/auth";

// Firebase API keys are NOT secret.
// They are required for client-side apps to connect to Firebase.
// Security is enforced via Firebase security rules, not by hiding these keys.
// See: https://firebase.google.com/docs/projects/api-keys
const firebaseConfig: Record<string, string> = {
  apiKey: "AIzaSyD_O0ag4gx0XoIu3H6vkUgaQZ9cu8W7H_0",
  authDomain: "flexibudget-1c39e.firebaseapp.com",
  projectId: "flexibudget-1c39e",
  storageBucket: "flexibudget-1c39e.firebasestorage.app",
  messagingSenderId: "176253607417",
  appId: "1:176253607417:web:cd1f8227cb94a755157128",
  measurementId: "G-MJ4TQV8E5F"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Lazy load analytics to reduce initial bundle size
let analytics: any = null;

export const getAnalytics = async () => {
  if (!analytics) {
    try {
      const { getAnalytics } = await import("firebase/analytics");
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('Analytics not available:', error);
      analytics = null;
    }
  }
  return analytics;
};

export const initializeAuth = async (): Promise<User> => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
}; 