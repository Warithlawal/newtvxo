// firebase.js

// ------------------------------
// Firebase Imports
// ------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";


// ------------------------------
// Firebase Config (YOUR CONFIG)
// ------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCF0aD1Lzkl6YzG8nDZy0E2E-u0GILrEDo",
  authDomain: "tvxosite-e8ea5.firebaseapp.com",
  projectId: "tvxosite-e8ea5",
  storageBucket: "tvxosite-e8ea5.firebasestorage.app",
  messagingSenderId: "790844081370",
  appId: "1:790844081370:web:1cbbad08cdb834701f11e3",
  measurementId: "G-D25WV9LHFX"
};


// ------------------------------
// Initialize App
// ------------------------------
export const app = initializeApp(firebaseConfig);

// Services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Optional Analytics
export const analytics = getAnalytics(app);


// ------------------------------
// EXPORT EVERYTHING admin.js NEEDS
// ------------------------------

export {
  // Firestore
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,

  // Auth
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
};
