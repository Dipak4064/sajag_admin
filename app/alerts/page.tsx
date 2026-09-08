'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, CheckCircle, Clock, PhoneCall, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { fadeUp, staggerContainer, spring } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AlertsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts');
      if (!res.data.success || !Array.isArray(res.data.data)) {
        throw new Error('Alert API returned an invalid response');
      }
      setEvents(res.data.data);
      setError(null);
    } catch (err) {
      setEvents([]);
      setError('Unable to load alerts from the backend. Check the API connection and refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const socket = getSocket();
    socket.on('alert:new', (event: any) => {
      setEvents((prev) => [event, ...prev]);
    });

    socket.on('alert:update', () => {
      fetchAlerts();
    });

    return () => {
      socket.off('alert:new');
      socket.off('alert:update');
    };
  }, []);

  const getStepClass = (currentStatus: string, step: string) => {
    const sequence = ['DETECTED', 'ANALYZING', 'CONFIRMED', 'NOTIFYING', 'RESOLVED'];
    const currentIndex = sequence.indexOf(currentStatus);
    const stepIndex = sequence.indexOf(step);

    if (currentIndex >= stepIndex)
      return 'text-emerald-300 font-bold border-emerald-500/50 bg-emerald-500/10';
    return 'text-slate-500 border-white/[0.06] bg-white/[0.03]';
  };

  // Severity → semantic scale. Only genuinely critical hazards get red.
  const severityVariant = (severity: string) =>
    severity === 'CRITICAL' || severity === 'SEVERE'
      ? ('destructive' as const)
      : severity === 'HIGH' || severity === 'MODERATE'
      ? ('warning' as const)
      : ('info' as const);

  const riskColor = (score: number) =>
    score >= 70 ? 'text-red-400' : score >= 40 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <BellRing className="w-5 h-5 text-cyan-400" />
          Alert State Machine & Automated Twilio Outbound Dispatch
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Lifecycle State Transition: <code>DETECTED ➔ ANALYZING ➔ CONFIRMED ➔ NOTIFYING ➔ RESOLVED</code>
        </p>
      </motion.div>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Querying alert dispatch logs...</div>
      ) : events.length === 0 ? (
        <motion.div variants={fadeUp}>
          <Card className="p-8 text-center text-xs text-slate-500">
            No disaster hazard events recorded. Use the "SIMULATE DISASTER" button to trigger an emergency curve.
          </Card>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout" initial={false}>
        {events.map((event) => (
          <motion.div
            key={event.id}
            layout
            variants={fadeUp}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, scale: 0.96 }}
          >
          <Card
            className={`p-5 space-y-4 transition-colors ${
              (event.severity === 'CRITICAL' || event.severity === 'SEVERE') &&
              event.status !== 'RESOLVED'
                ? '!border-red-500/45 shadow-glow-red'
                : ''
            }`}
          >
            {/* Event Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white">{event.title || event.type}</span>
                  <Badge variant={severityVariant(event.severity)}>{event.severity}</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{event.description}</p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Risk Score</div>
                <div className={`text-lg font-black ${riskColor(event.riskScore)}`}>
                  {event.riskScore} / 100
                </div>
              </div>
            </div>

            {/* State Machine Step Bar */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">State Machine Pipeline:</span>
              <div className="grid grid-cols-5 gap-1 text-[11px] text-center font-mono">
                {['DETECTED', 'ANALYZING', 'CONFIRMED', 'NOTIFYING', 'RESOLVED'].map((st) => (
                  <div key={st} className={`py-1.5 rounded-lg border ${getStepClass(event.status, st)}`}>
                    {st}
                  </div>
                ))}
              </div>
            </div>

            {/* Twilio IVR Outbound Log */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                  Twilio IVR Voice Dispatch Log ({event.alerts?.length || 0} Residents Targeted)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">5km Geofenced Ring</span>
              </div>

              <div className="divide-y divide-white/[0.05] bg-white/[0.03] rounded-xl border border-white/[0.06] text-xs">
                {event.alerts && event.alerts.length > 0 ? (
                  event.alerts.map((al: any) => (
                    <div key={al.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{al.user?.name || 'Resident'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{al.user?.phone}</div>
                      </div>

                      <div className="text-right space-y-0.5">
                        <Badge
                          variant={
                            al.status === 'SAFE' ? 'success' : al.status === 'UNSAFE' ? 'destructive' : 'warning'
                          }
                        >
                          {al.status}
                        </Badge>
                        {al.responses?.[0]?.message && (
                          <div className="text-[10px] text-slate-400 italic">
                            "{al.responses[0].message}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No active phone alerts dispatched yet.
                  </div>
                )}
              </div>
            </div>
          </Card>
          </motion.div>
        ))}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
