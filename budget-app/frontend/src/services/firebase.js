// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD_O0ag4gx0XoIu3H6vkUgaQZ9cu8W7H_0",
  authDomain: "flexibudget-1c39e.firebaseapp.com",
  projectId: "flexibudget-1c39e",
  storageBucket: "flexibudget-1c39e.firebasestorage.app",
  messagingSenderId: "176253607417",
  appId: "1:176253607417:web:cd1f8227cb94a755157128",
  measurementId: "G-MJ4TQV8E5F"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize anonymous authentication
export const initializeAuth = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
}; 