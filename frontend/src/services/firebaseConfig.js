// Firebase Configuration
// You'll get these values from your Firebase Console

export const firebaseConfig = {
  apiKey: "AIzaSyAeqDq2_j0Pm5aV7Fn_lHEhxhM9t_XMZ_0",
  authDomain: "incident-response-poc.firebaseapp.com",
  projectId: "incident-response-poc",
  storageBucket: "incident-response-poc.firebasestorage.app",
  messagingSenderId: "696115858472",
  appId: "1:696115858472:web:b8968969b5e98eb161b91d"
};

// Initialize Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);