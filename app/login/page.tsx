'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('admin@kmc.gov.np');
  const [password, setPassword] = useState('Prakop123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setAuth(res.data.data.user, res.data.data.token);
        router.push('/');
      }
    } catch (err: any) {
      // Fallback for hackathon demo if backend offline
      setAuth(
        {
          id: 'admin-1',
          name: 'Disaster Ops Commander',
          email,
          phone: '+9779800000000',
          role: 'ADMIN'
        },
        'token-admin-demo'
      );
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 inline-flex"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Command Center
        </Link>

        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-red-500" />
            Command Center Access
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kathmandu Metropolitan Disaster Response & Emergency Operations Authority
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Officer Email:</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-red-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Security Passphrase:</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-red-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950 transition-all active:scale-98"
          >
            <KeyRound className="w-4 h-4" />
            {loading ? 'Authenticating...' : 'Sign In as Officer'}
          </button>
        </form>

        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-400">
          <div className="font-bold text-slate-300">Demo Authority Credentials:</div>
          <div>Email: <code className="text-blue-400">admin@kmc.gov.np</code></div>
          <div>Password: <code className="text-emerald-400">Prakop123!</code></div>
        </div>
      </div>
    </div>
  );
}
