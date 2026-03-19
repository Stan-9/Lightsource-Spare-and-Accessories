# LightSource Motors - Spares Catalog

A modern, frontend-only e-commerce web app for a motorbike spare parts shop, powered by React (Vite) and Firebase.

## Features

- **Storefront**: Real-time product catalog with search, filtering, and stock status.
- **WhatsApp Checkout**: Users can checkout via WhatsApp, sending a formatted cart list directly to the shop owner's number.
- **Admin Dashboard**: Protect route for store management.
- **Real-time Inventory**: View, add, edit, and delete products easily. Inline stock adjustment.
- **Firebase Backend**: No custom backend needed. Runs entirely on Firebase Firestore, Auth, and Storage.

## Technology Stack
- React (Vite)
- Tailwind CSS
- Firebase (Firestore + Auth + Storage)
- react-router-dom
- react-hot-toast for notifications

## Deployment Instructions

This project is built to run on the **Firebase Free Spark plan** for backend services and **Vercel** for the frontend hosting.

### 1. Firebase Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Firestore Database**:
   - Start in production mode.
   - Go to Rules and apply the following to secure read/write:
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /products/{document=**} {
           allow read: if true;
           allow write: if request.auth != null;
         }
         match /settings/{document=**} {
           allow read: if true;
           allow write: if request.auth != null;
         }
       }
     }
     ```
3. Enable **Firebase Storage**:
   - Apply the following Rules:
     ```
     rules_version = '2';
     service firebase.storage {
       match /b/{bucket}/o {
         match /{allPaths=**} {
           allow read: if true;
           allow write: if request.auth != null;
         }
       }
     }
     ```
4. Enable **Authentication**:
   - Enable Email/Password provider.
   - Create one Admin account manually using the "Add User" button. This will be the credentials used to log into `/admin`.
5. Get your Firebase Config from Project Settings > General > Your Apps (Web App).

### 2. Connect Repo to Vercel
1. Push this codebase to a GitHub repository.
2. Go to Vercel and create a new project from your repo.
3. In the Vercel project settings, add all the environment variables from your Firebase config:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Deploy the app. Vercel will auto-deploy on every new push to the main branch.

**Done.** No server to manage, no monthly bills.

## Local Development
1. Clone the repo
2. Rename `.env` (or duplicate it) and populate with your Firebase credentials
3. Run `npm install`
4. Run `npm run dev`
