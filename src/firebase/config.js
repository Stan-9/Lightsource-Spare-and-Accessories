import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

/**
 * Firebase project configuration.
 * Uses environment variables if present, with fallback to project defaults
 * so static client builds on Cloudflare Pages function smoothly without build-time env injection.
 */
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "AIzaSyBYzC2sijes-eWHXgyU2f0MPFMZ4o6_Q5s",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "lightsource-894e9.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "lightsource-894e9",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "lightsource-894e9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "142379699375",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:142379699375:web:c0b47c2eba1d9e1552185a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);
