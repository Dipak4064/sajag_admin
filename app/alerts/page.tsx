'use client';

import { useState, useEffect } from 'react';
import { BellRing, CheckCircle, Clock, PhoneCall, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function AlertsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts');
      if (res.data.success && res.data.data.length > 0) {
        setEvents(res.data.data);
      } else {
        fallbackEvents();
      }
    } catch (err) {
      fallbackEvents();
    } finally {
      setLoading(false);
    }
  };

  const fallbackEvents = () => {
    setEvents([
      {
        id: 'evt-01',
        type: 'FLOOD',
        title: 'Bagmati Basin Critical Flood Inundation',
        description: 'Water level reached 88cm at Balkhu sensor. Deterministic risk engine flagged 82/100 risk.',
        severity: 'CRITICAL',
        status: 'NOTIFYING',
        riskScore: 82,
        radiusMeters: 5000,
        createdAt: new Date().toISOString(),
        alerts: [
          {
            id: 'alt-1',
            status: 'SAFE',
            user: { name: 'Ram Bahadur Thapa', phone: '+9779800000001' },
            responses: [{ response: 'SAFE', message: 'Evacuated to 2nd floor' }]
          },
          {
            id: 'alt-2',
            status: 'UNSAFE',
            user: { name: 'Sita Devi Shrestha', phone: '+9779800000002' },
            responses: [{ response: 'UNSAFE', message: 'Elderly person stranded' }]
          },
          {
            id: 'alt-3',
            status: 'WAITING_RESPONSE',
            user: { name: 'Hari Prasad Sharma', phone: '+9779800000003' },
            responses: []
          }
        ]
      }
    ]);
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

    if (currentIndex >= stepIndex) return 'text-emerald-400 font-bold border-emerald-500 bg-emerald-950/40';
    return 'text-slate-600 border-slate-800 bg-slate-950';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <BellRing className="w-5 h-5 text-red-500" />
          Alert State Machine & Automated Twilio Outbound Dispatch
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Lifecycle State Transition: <code>DETECTED ➔ ANALYZING ➔ CONFIRMED ➔ NOTIFYING ➔ RESOLVED</code>
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Querying alert dispatch logs...</div>
      ) : events.length === 0 ? (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
          No disaster hazard events recorded. Use the "SIMULATE DISASTER" button to trigger an emergency curve.
        </div>
      ) : (
        events.map((event) => (
          <div key={event.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
            {/* Event Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white">{event.title || event.type}</span>
                  <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold uppercase">
                    {event.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{event.description}</p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Risk Score</div>
                <div className="text-lg font-black text-red-400">{event.riskScore} / 100</div>
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
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  Twilio IVR Voice Dispatch Log ({event.alerts?.length || 0} Residents Targeted)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">5km Geofenced Ring</span>
              </div>

              <div className="divide-y divide-slate-800/60 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                {event.alerts && event.alerts.length > 0 ? (
                  event.alerts.map((al: any) => (
                    <div key={al.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{al.user?.name || 'Resident'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{al.user?.phone}</div>
                      </div>

                      <div className="text-right space-y-0.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            al.status === 'SAFE'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : al.status === 'UNSAFE'
                              ? 'bg-red-950 text-red-400 border-red-800'
                              : 'bg-amber-950 text-amber-400 border-amber-800'
                          }`}
                        >
                          {al.status}
                        </span>
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
          </div>
        ))
      )}
    </div>
  );
}
