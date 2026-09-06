'use client';

import { useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { LOGIN_URL } from '@/lib/session';

/*
  The operations console has no sign-in of its own — authentication happens on
  the citizen app, which routes municipal accounts back here afterwards. This
  route only exists so old links to /admin/login still land somewhere sensible.
*/
export default function AdminLoginRedirectPage() {
  useEffect(() => {
    window.location.replace(LOGIN_URL);
  }, []);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 p-4 text-center">
      <ShieldCheck className="h-8 w-8 text-cyan-400" />
      <p className="text-sm font-semibold text-slate-200">
        Taking you to the SAJAG sign-in…
      </p>
      <p className="max-w-sm text-xs text-slate-500">
        Municipal officers sign in through the citizen portal and are returned to the
        Command Center automatically.
      </p>
      <a
        href={LOGIN_URL}
        className="mt-1 text-xs font-semibold text-cyan-400 underline-offset-4 hover:underline"
      >
        Continue to sign-in
      </a>
    </div>
  );
}
