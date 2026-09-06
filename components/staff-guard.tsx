'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { CITIZEN_APP_URL, LOGIN_URL } from '@/lib/session';

/*
  Gate for the operations console. The session is restored on the client only
  (it lives in localStorage + a host-scoped cookie), so this waits for hydration
  before deciding — otherwise every first paint would bounce to sign-in.

  There is no sign-in page here: authentication happens on the citizen app,
  which sends municipal accounts back to this console.
*/
export default function StaffGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isHydrated, isAuthenticated, isStaff, hydrate } = useAuthStore();

  // The /admin/login stub redirects on its own; don't fight it.
  const isLoginRoute = pathname === '/login';

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated || isLoginRoute) return;

    if (!isAuthenticated) {
      window.location.href = LOGIN_URL;
      return;
    }

    // Signed in, but not municipal staff — send them to the citizen portal.
    if (!isStaff) {
      window.location.href = CITIZEN_APP_URL;
    }
  }, [isHydrated, isAuthenticated, isStaff, isLoginRoute]);

  if (isLoginRoute) return <>{children}</>;

  if (!isHydrated || !isAuthenticated || !isStaff) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <ShieldAlert className="h-8 w-8 text-cyan-400" />
        <p className="text-sm font-semibold text-slate-300">
          {!isHydrated ? 'Verifying operations credentials…' : 'Redirecting to sign-in…'}
        </p>
        <p className="text-xs text-slate-500">Kathmandu Metropolitan Command Center</p>
      </div>
    );
  }

  return <>{children}</>;
}
