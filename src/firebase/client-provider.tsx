'use client';

import React, { ReactNode, useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './index';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * FirebaseClientProvider handles the initialization of Firebase services
 * exclusively on the client side to prevent serialization errors when
 * passing complex objects from Server Components.
 */
export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  // Use useMemo to ensure Firebase is initialized only once per client session
  const { firebaseApp, firestore, auth } = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      {children}
    </FirebaseProvider>
  );
}
