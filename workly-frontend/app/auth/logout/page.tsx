'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

/**
 * Logout page - logs out the user and redirects to login
 */
export default function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Logging out...</p>
      </div>
    </div>
  );
}
