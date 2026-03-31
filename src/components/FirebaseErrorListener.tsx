
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = errorEmitter.on('permission-error', (error) => {
      console.error('Firestore Permission Error:', error);
      
      // Cleanup safety: Pastikan pointer-events dikembalikan jika terjadi hang pada UI portal
      if (typeof document !== 'undefined') {
        document.body.style.pointerEvents = 'auto';
      }

      toast({
        variant: "destructive",
        title: "Kendala Izin Akses",
        description: "Akun Anda tidak memiliki izin untuk melihat data ini. Pastikan Anda telah masuk dengan akun resmi JAYA.",
      });
    });
    return () => unsubscribe();
  }, [toast]);

  return null;
}
