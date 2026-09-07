'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Radio,
  BellRing,
  LifeBuoy,
  Users,
  FileSpreadsheet,
  Flame,
  ExternalLink,
  Activity,
  Menu,
  X,
  UserCircle,
  LogOut
} from 'lucide-react';
import SimulationModal from '@/components/simulation/simulation-modal';
import PageTransition from '@/components/page-transition';
import StaffGuard from '@/components/staff-guard';
import SajagMark from '@/components/brand/sajag-mark';
import { Button } from '@/components/ui/button';
import { CITIZEN_APP_URL, ADMIN_LOGIN_URL } from '@/lib/session';
import { useAuthStore } from '@/stores/auth.store';
import { getSocket } from '@/lib/socket';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  AUTHORITY: 'Authority',
  RESPONDER: 'Responder',
  RESCUE_TEAM: 'Rescue Team',
  CITIZEN: 'Citizen'
};

const navGroups = [
  {
    label: 'Overview',
    items: [{ href: '/', label: 'Command Center', icon: ShieldAlert }]
  },
  {
    label: 'Monitor',
    items: [
      { href: '/devices', label: 'IoT Sensors & LoRa', icon: Radio },
      { href: '/alerts', label: 'Alerts & IVR', icon: BellRing }
    ]
  },
  {
    label: 'Respond',
    items: [
      { href: '/sos', label: 'SOS Triage', icon: LifeBuoy },
      { href: '/reports', label: 'Citizen Reports', icon: FileSpreadsheet }
    ]
  },
  {
    label: 'Manage',
    items: [{ href: '/users', label: 'Residents Roster', icon: Users }]
  }
];

const allNavItems = navGroups.flatMap((g) => g.items);

/*
  These are declared at module scope on purpose. Defined inside AdminLayout they
  would be a new component type on every render — and the header clock re-renders
  once a second, which remounted the whole nav and restarted its animations.
*/

// `idPrefix` keeps the desktop sidebar and the mobile drawer from ever sharing a
// layoutId; two live elements with the same one make the indicator jump panes.
function NavList({ showLabels, idPrefix }: { showLabels: boolean; idPrefix: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto scrollbar-thin-slate px-3 py-4 space-y-5">
      {navGroups.map((group) => (
        <div key={group.label} className="space-y-1">
          <AnimatePresence initial={false}>
            {showLabels && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
              >
                {group.label}
              </motion.div>
            )}
          </AnimatePresence>

          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={showLabels ? undefined : item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${
                  isActive ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId={`${idPrefix}-active`}
                    className="absolute inset-0 rounded-lg border border-cyan-400/25 bg-cyan-400/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4 shrink-0" />
                <AnimatePresence initial={false}>
                  {showLabels && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      className="relative z-10 truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Brand({ showLabels }: { showLabels: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-4 py-4">
      <motion.div
        whileHover={{ rotate: -6, scale: 1.06 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="shrink-0"
      >
        <SajagMark className="h-9 w-9" title="SAJAG" />
      </motion.div>
      <AnimatePresence initial={false}>
        {showLabels && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            className="min-w-0"
          >
            <div className="truncate text-sm font-extrabold tracking-wide text-white">
              SAJAG <span className="text-cyan-400">// PRAKOP</span>
            </div>
            <div className="truncate text-[10px] text-slate-500">Kathmandu Command Center</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}

function StatusFooter({
  showLabels,
  socketConnected
}: {
  showLabels: boolean;
  socketConnected: boolean;
}) {
  return (
    <div className="border-t border-white/[0.06] p-3 space-y-2">
      <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-2 text-[11px] font-medium text-slate-400">
        <span className="relative flex h-2 w-2 shrink-0">
          {socketConnected && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              socketConnected ? 'bg-emerald-400' : 'bg-amber-500'
            }`}
          />
        </span>
        {showLabels && (
          <span className="truncate">{socketConnected ? 'Telemetry Live' : 'Connecting…'}</span>
        )}
      </div>

      {showLabels && (
        <Button asChild variant="outline" size="sm" className="w-full justify-center">
          <a href={CITIZEN_APP_URL} target="_blank" rel="noopener noreferrer">
            Citizen View <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      )}
    </div>
  );
}

// Isolated so its 1s tick re-renders only the clock, not the whole shell.
function OpsClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () =>
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 font-mono text-xs text-slate-400 sm:flex">
      <Activity className="h-3.5 w-3.5 text-cyan-400" />
      <span suppressHydrationWarning>{time || '00:00:00'} NPT</span>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleSignOut = () => {
    logout();
    // basePath-aware: the console's sign-in lives at /admin/login.
    window.location.href = ADMIN_LOGIN_URL;
  };

  useEffect(() => {
    const socket = getSocket();
    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const activeItem = allNavItems.find((i) => i.href === pathname);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <>
      {/* ---------- Desktop sidebar ---------- */}
        {/*
          Hover-driven rail: sits collapsed at 4.25rem and expands to 15rem on
          pointer enter. It overlays the content (which keeps a fixed rail-width
          offset) so the page never reflows as the pointer crosses it.
        */}
        <motion.aside
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          onFocusCapture={() => setExpanded(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setExpanded(false);
          }}
          initial={false}
          animate={{
            width: expanded ? '15rem' : '4.25rem',
            boxShadow: expanded
              ? '0 24px 60px -20px rgba(0,0,0,0.85)'
              : '0 0px 0px 0px rgba(0,0,0,0)'
          }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          className="fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-white/[0.06] bg-[hsl(221_47%_7%_/_0.95)] backdrop-blur-xl lg:flex"
        >
          <Brand showLabels={expanded} />
          <NavList showLabels={expanded} idPrefix="sidebar" />
          <StatusFooter showLabels={expanded} socketConnected={socketConnected} />
        </motion.aside>

        {/* ---------- Mobile drawer ---------- */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileNavOpen(false)}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 360, damping: 36 }}
                className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.06] bg-[hsl(221_47%_7%)] lg:hidden"
              >
                <div className="flex items-center justify-between pr-2">
                  <Brand showLabels />
                  <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <NavList showLabels idPrefix="drawer" />
                <StatusFooter showLabels socketConnected={socketConnected} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ---------- Content column ---------- */}
        {/* Offset is fixed at the rail width — the sidebar expands over the
            content on hover rather than pushing it, so nothing reflows. */}
        <div className="flex min-h-screen flex-col lg:pl-[4.25rem]">
          <div className="flex min-h-screen flex-col">
            {/* Top bar */}
            <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[hsl(222_48%_5%_/_0.72)] px-4 py-2.5 backdrop-blur-xl sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileNavOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-sm font-extrabold tracking-wide text-white">
                      {activeItem?.label ?? 'Command Center'}
                    </h1>
                    <span className="hidden rounded border border-cyan-400/25 bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 sm:inline">
                      OPERATIONS
                    </span>
                  </div>
                  <p className="truncate text-[10px] text-slate-500">
                    Kathmandu Metropolitan City · Disaster Operations
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                <OpsClock />

                {user && (
                  <>
                    <div className="hidden items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 sm:flex">
                      <UserCircle className="h-4 w-4 shrink-0 text-cyan-400" />
                      <div className="leading-tight">
                        <div className="max-w-[110px] truncate text-[11px] font-bold text-slate-200">
                          {user.name}
                        </div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-cyan-400/80">
                          {ROLE_LABELS[user.role] ?? user.role}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" title="Sign out" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 text-slate-400" />
                    </Button>
                  </>
                )}

                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="destructive" size="sm" onClick={() => setIsSimModalOpen(true)}>
                    <motion.span
                      animate={{ rotate: [0, -8, 8, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      className="inline-flex"
                    >
                      <Flame className="h-3.5 w-3.5 text-amber-300" />
                    </motion.span>
                    <span className="hidden sm:inline">SIMULATE DISASTER</span>
                    <span className="sm:hidden">SIM</span>
                  </Button>
                </motion.div>
              </div>
            </header>

            <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6">
              <StaffGuard>
                <PageTransition>{children}</PageTransition>
              </StaffGuard>
            </main>
          </div>
        </div>

        <AnimatePresence>
          {isSimModalOpen && (
            <SimulationModal isOpen={isSimModalOpen} onClose={() => setIsSimModalOpen(false)} />
          )}
        </AnimatePresence>
    </>
  );
}
