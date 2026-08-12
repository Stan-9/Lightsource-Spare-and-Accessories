import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyApiKeyForLocalTesting123456",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lightsource-894e9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lightsource-894e9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lightsource-894e9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "142379699375",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:142379699375:web:c0b47c2eba1d9e1552185a"
};

// Debug Log (Safe to show in production for debugging)
console.log("Firebase initialized for project:", import.meta.env.VITE_FIREBASE_PROJECT_ID || "MISSING");

if (!firebaseConfig.apiKey) {
  console.error("CRITICAL ERROR: VITE_FIREBASE_API_KEY is missing!");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
