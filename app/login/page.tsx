'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  Radar,
  Activity,
  ExternalLink,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { isStaffRole, CITIZEN_APP_URL } from '@/lib/session';
import { fadeUp, scaleIn, staggerContainer } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SajagMark from '@/components/brand/sajag-mark';

const DEMO_CREDENTIALS = [
  { label: 'Emergency Director', email: 'admin@kathmandu.gov.np', password: 'Admin@123' },
  { label: 'Operations Officer', email: 'officer@kathmandu.gov.np', password: 'Officer@123' }
];

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingCreds, setRefreshingCreds] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const finishSession = (user: any, token: string) => {
    setAuth(user, token);
    router.push('/');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your staff email and password to open the command center.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      const { user, token } = res.data.data;

      if (!isStaffRole(user.role)) {
        setError('This account is not cleared for the Operations Command Center. Municipal staff only.');
        return;
      }

      finishSession(user, token);
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      if (status === 422 && code === 'PASSWORD_NOT_SET') {
        setError('This account has no password (created via citizen Check-in). Use it on the Citizen Portal instead.');
      } else if (status === 401) {
        setError('Invalid email or password. Use the demo credentials below to explore the console.');
      } else if (status === 403) {
        setError('This account is not authorized for the Operations Command Center.');
      } else {
        setError(
          'The backend is unreachable right now. Use demo access below to explore the console offline.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async (creds?: { email: string; password: string }) => {
    setDemoLoading(true);
    setError(null);
    const email = creds?.email ?? DEMO_CREDENTIALS[0].email;
    const password = creds?.password ?? DEMO_CREDENTIALS[0].password;
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data.data;
      finishSession(user, token);
    } catch {
      // Backend unreachable or account not seeded — fall back to a clearly
      // labeled local demo session so the console stays explorable offline.
      finishSession(
        {
          id: 'demo-admin',
          name: 'Operations Commander (Demo)',
          email,
          phone: '',
          role: 'ADMIN',
          photoUrl: null
        },
        `demo-${Date.now()}`
      );
    } finally {
      setDemoLoading(false);
    }
  };

  const handleRefreshDemo = () => {
    setRefreshingCreds(true);
    setEmail(DEMO_CREDENTIALS[0].email);
    setPassword(DEMO_CREDENTIALS[0].password);
    setTimeout(() => {
      setRefreshingCreds(false);
      formRef.current?.requestSubmit();
    }, 450);
  };

  return (
    <motion.div
      variants={staggerContainer(0.09)}
      initial="hidden"
      animate="show"
      className="grid-overlay relative flex min-h-screen flex-col items-center justify-center px-4 py-10"
    >
      {/* Ambient site status strip */}
      <motion.div
        variants={fadeUp}
        className="absolute top-5 left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        Kathmandu Metropolitan · Command Grid Nominal
      </motion.div>

      <motion.div variants={scaleIn} className="w-full max-w-md">
        <Card className="glass-card relative overflow-hidden p-6 sm:p-8 space-y-6">
          {/* Brand glow accent */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: -6, scale: 1.06 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                <SajagMark className="h-12 w-12" title="SAJAG" />
              </motion.div>
              <div>
                <h1 className="text-lg font-black text-white leading-tight">
                  SAJAG <span className="text-cyan-400">// PRAKOP</span>
                </h1>
                <p className="text-[11px] text-slate-400">
                  Kathmandu Disaster Operations &amp; Command Center
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-slate-400">
                Restricted access. Sign in with a&nbsp;
                <span className="text-slate-200 font-semibold">municipal staff account</span> to
                open the console. Regular citizens stay on the citizen portal.
              </p>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 leading-relaxed"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form ref={formRef} onSubmit={handleSignIn} className="relative space-y-4">
            <div>
              <Label className="mb-1 block">Staff Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="email"
                  autoComplete="username"
                  placeholder="name@kathmandu.gov.np"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1 block">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
              <Button type="submit" disabled={loading} size="lg" className="w-full">
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    Verifying credentials…
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Open Command Center
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          <div className="relative">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-slate-500">
              <span className="h-px flex-1 bg-white/[0.08]" />
              Demo Access
              <span className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <div className="mt-3 space-y-2">
              {DEMO_CREDENTIALS.map((creds) => (
                <motion.button
                  key={creds.email}
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDemoAccess(creds)}
                  disabled={demoLoading}
                  className="w-full flex items-center justify-between gap-2 p-3 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] hover:border-cyan-400/45 hover:bg-cyan-400/[0.1] text-left transition-colors disabled:opacity-60"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
                      <Zap className="w-3 h-3" />
                      {creds.label}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                      {creds.email}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {creds.password}
                  </span>
                </motion.button>
              ))}

              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDemoAccess(undefined)}
                disabled={demoLoading}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-white/15 hover:border-emerald-400/40 text-[11px] font-semibold text-slate-400 hover:text-emerald-300 transition-colors disabled:opacity-60"
              >
                <Radar className="w-3.5 h-3.5" />
                {demoLoading ? 'Signing in…' : 'One-tap demo sign-in (offline-safe)'}
              </motion.button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
            <a
              href={CITIZEN_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Not staff? Citizen Portal
            </a>
            <motion.button
              type="button"
              onClick={handleRefreshDemo}
              disabled={refreshingCreds}
              className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
            >
              {refreshingCreds ? (
                <Activity className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              {refreshingCreds ? 'Signing you in…' : 'Auto-fill & sign in'}
            </motion.button>
          </div>
        </Card>
      </motion.div>

      <motion.p variants={fadeUp} className="mt-4 text-center text-[10px] text-slate-600">
        v1.0 · KMC Early Warning, Geo-IoT &amp; Community Response Platform
      </motion.p>
    </motion.div>
  );
}