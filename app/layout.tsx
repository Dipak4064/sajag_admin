'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Radio,
  BellRing,
  LifeBuoy,
  Users,
  FileSpreadsheet,
  Flame,
  ExternalLink,
  Activity
} from 'lucide-react';
import './globals.css';
import SimulationModal from '@/components/simulation/simulation-modal';
import { getSocket } from '@/lib/socket';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);

    const socket = getSocket();
    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    return () => {
      clearInterval(interval);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const navItems = [
    { href: '/', label: 'Command Center', icon: ShieldAlert },
    { href: '/devices', label: 'IoT Sensors & LoRa', icon: Radio },
    { href: '/alerts', label: 'Alerts & IVR', icon: BellRing },
    { href: '/sos', label: 'SOS Triage', icon: LifeBuoy },
    { href: '/reports', label: 'Citizen Reports', icon: FileSpreadsheet },
    { href: '/users', label: 'Residents Roster', icon: Users }
  ];

  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased">
        {/* Top Operations Header */}
        <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-red-600 to-rose-600 rounded-lg text-white font-black text-sm shadow-md shadow-red-950">
                स
              </div>
              <div>
                <div className="font-extrabold text-sm text-white tracking-wide flex items-center gap-2">
                  SAJAG // PRAKOP
                  <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                    OPERATIONS
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">Kathmandu Metropolitan Command Center</div>
              </div>
            </Link>

            {/* Tactical Navigation Bar */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Status & Controls */}
          <div className="flex items-center gap-3">
            {/* Live UTC/Local Time */}
            <div className="hidden sm:flex items-center gap-1 text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{time || '00:00:00'} NPT</span>
            </div>

            {/* Socket Status */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
              <span className="hidden md:inline">{socketConnected ? 'Telemetry Live' : 'Connecting'}</span>
            </div>

            {/* Hackathon 1-Click Simulator Trigger */}
            <button
              onClick={() => setIsSimModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold shadow-lg shadow-red-950/70 active:scale-95 transition-transform"
            >
              <Flame className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
              <span>SIMULATE DISASTER</span>
            </button>

            {/* Public Portal Link */}
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Citizen View <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </header>

        {/* Mobile Navigation Strip */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto p-2 bg-slate-900 border-b border-slate-800 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg whitespace-nowrap text-[11px] font-semibold ${
                  isActive ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400'
                }`}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>

        {/* Simulation Modal */}
        <SimulationModal
          isOpen={isSimModalOpen}
          onClose={() => setIsSimModalOpen(false)}
        />
      </body>
    </html>
  );
}
