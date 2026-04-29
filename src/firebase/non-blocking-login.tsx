'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  // Force account selection to help with stuck sessions and clarity
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  return signInWithPopup(authInstance, provider)
    .then(() => {
      // Success is handled by the provider's onAuthStateChanged listener
    })
    .catch((error: any) => {
      if (error.code === 'auth/popup-closed-by-user') {
        return;
      }
      // Re-throw to be handled by the UI
      throw error;
    });
}
