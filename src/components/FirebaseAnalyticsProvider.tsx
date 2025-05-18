'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { initializeAnalytics } from '@/lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Pages that don't require authentication
const publicPages = ['/login', '/register', '/forgot-password', '/'];

export function FirebaseAnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Initialize Firebase Analytics
    const analytics = initializeAnalytics();
    
    // Log page view
    if (analytics) {
      console.log('Firebase Analytics initialized');
    }

    // Handle authentication
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthChecked(true);
      
      // If on a public page and already authenticated, redirect to home
      if (user && publicPages.includes(pathname)) {
        router.push('/');
        return;
      }

      // If no user on public pages, allow access without redirect
      if (!user && publicPages.includes(pathname)) {
        return;
      }
      
      // If no user on a protected page, try anonymous auth as fallback
      if (!user && !publicPages.includes(pathname)) {
        console.log('No user detected, redirecting to login page');
        // Redirecting to login instead of using anonymous auth
        router.push('/login');
        return;
      }
      
      // Log user info if authenticated
      if (user) {
        console.log('User authenticated:', user.uid, user.isAnonymous ? '(anonymous)' : '');
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Show nothing while checking authentication
  if (!authChecked && !publicPages.includes(pathname)) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return <>{children}</>;
} 