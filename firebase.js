import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCF0aD1Lzkl6YzG8nDZy0E2E-u0GILrEDo",
  authDomain: "tvxosite-e8ea5.firebaseapp.com",
  projectId: "tvxosite-e8ea5",
  storageBucket: "tvxosite-e8ea5.firebasestorage.app",
  messagingSenderId: "790844081370",
  appId: "1:790844081370:web:1cbbad08cdb834701f11e3",
  measurementId: "G-D25WV9LHFX"
};

const app = initializeApp(firebaseConfig);

// Initialize Services
const db = getFirestore(app);
const auth = getAuth(app);

// Optional Analytics
const analytics = getAnalytics(app);

export { db, auth };
