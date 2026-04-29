'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export function initializeFirebase() {
  let app: FirebaseApp;
  
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // Initialize Auth persistence once
    const auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.error("Firebase persistence error:", err);
    });
  } else {
    app = getApp();
  }
    
  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

/** Helper function to get Firebase services without hooks. */
export function getFirebase() {
  const { auth, firestore } = initializeFirebase();
  return { auth, firestore };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
