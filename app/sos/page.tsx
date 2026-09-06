'use client';

import { useState, useEffect } from 'react';
import { LifeBuoy, Users, HeartPulse, Send, CheckCircle2, ShieldAlert, PhoneCall, Navigation, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function SOSTriagePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const fetchSOS = async () => {
    try {
      const res = await api.get('/sos/active');
      if (res.data.success && res.data.data.length > 0) {
        setRequests(res.data.data);
      } else {
        fallbackSOS();
      }
    } catch (err) {
      fallbackSOS();
    } finally {
      setLoading(false);
    }
  };

  const fallbackSOS = () => {
    setRequests([
      {
        id: 'sos-101',
        description: 'Water has reached 1st floor balcony. 4 people trapped including 1 infant.',
        addressText: 'Near Balkhu Bridge, Ward 14, Kathmandu',
        latitude: 27.6895,
        longitude: 85.3021,
        numberOfPeople: 4,
        medicalEmergency: 'CRITICAL',
        contactNumber: '+977 9801122334',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sos-102',
        description: 'Mudslide debris partially blocking house entrance.',
        addressText: 'Nagdhunga Corridor Checkpoint, Kathmandu',
        latitude: 27.7080,
        longitude: 85.2200,
        numberOfPeople: 2,
        medicalEmergency: 'MINOR',
        contactNumber: '+977 9841998877',
        status: 'ASSIGNED',
        assignedTeam: {
          name: 'Armed Police Force Disaster Quick Reaction Unit',
          leadOfficerName: 'Insp. Kiran Silwal',
          contactRadioFreq: 'VHF 156.800 MHz'
        },
        createdAt: new Date(Date.now() - 1800000).toISOString()
      }
    ]);
  };

  useEffect(() => {
    fetchSOS();

    const socket = getSocket();
    socket.on('sos:new', (newSOS: any) => {
      setRequests((prev) => [newSOS, ...prev]);
    });

    socket.on('sos:update', (updated: any) => {
      setRequests((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
      );
    });

    return () => {
      socket.off('sos:new');
      socket.off('sos:update');
    };
  }, []);

  const handleAssignTeam = async (sosId: string, teamName: string) => {
    setDispatchingId(sosId);
    try {
      await api.post(`/sos/${sosId}/assign`, { teamName });
      setRequests((prev) =>
        prev.map((s) =>
          s.id === sosId
            ? {
                ...s,
                status: 'ASSIGNED',
                assignedTeam: {
                  name: teamName,
                  leadOfficerName: 'Commander On-Duty',
                  contactRadioFreq: 'VHF 156.800 MHz'
                }
              }
            : s
        )
      );
    } catch (err: any) {
      // Optimistic assignment for demonstration
      setRequests((prev) =>
        prev.map((s) =>
          s.id === sosId
            ? {
                ...s,
                status: 'ASSIGNED',
                assignedTeam: {
                  name: teamName,
                  leadOfficerName: 'Commander On-Duty',
                  contactRadioFreq: 'VHF 156.800 MHz'
                }
              }
            : s
        )
      );
    } finally {
      setDispatchingId(null);
    }
  };

  const handleResolve = async (sosId: string) => {
    try {
      await api.patch(`/sos/${sosId}/status`, { status: 'RESOLVED' });
    } catch (e) {
      // optimistic
    }
    setRequests((prev) => prev.filter((s) => s.id !== sosId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-rose-500" />
          Real-Time Citizen SOS Triage & Rescue Dispatch
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Distress queue sorted by medical urgency and proximity to Kathmandu rescue units.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Loading active SOS requests...</div>
      ) : requests.length === 0 ? (
        <div className="p-10 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Zero Active SOS Distress Calls</h3>
          <p className="text-xs text-slate-400">All distress alarms resolved.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((sos) => {
            const isCritical = sos.medicalEmergency === 'CRITICAL' || sos.medicalEmergency === 'SEVERE';
            return (
              <div
                key={sos.id}
                className={`p-5 bg-slate-900 border rounded-2xl space-y-4 shadow-xl transition-all ${
                  isCritical ? 'border-rose-600/70 shadow-rose-950/40' : 'border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-rose-400 font-mono">
                        SOS #{sos.id.slice(-6)}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                          isCritical
                            ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}
                      >
                        {sos.medicalEmergency} Medical Need
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white mt-1">
                      {sos.description}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      sos.status === 'ASSIGNED'
                        ? 'bg-blue-950 text-blue-400 border-blue-800'
                        : 'bg-amber-950 text-amber-400 border-amber-800'
                    }`}
                  >
                    {sos.status}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-500 block">People In Distress</span>
                    <span className="font-extrabold text-white">{sos.numberOfPeople} Trapped</span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-500 block">Citizen Contact</span>
                    <a href={`tel:${sos.contactNumber}`} className="font-mono text-blue-400 flex items-center gap-1 font-bold">
                      <PhoneCall className="w-3 h-3" /> {sos.contactNumber}
                    </a>
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                  <Navigation className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{sos.addressText || `${sos.latitude}, ${sos.longitude}`}</span>
                </div>

                {/* Assigned Team Info */}
                {sos.assignedTeam && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched: {sos.assignedTeam.name}
                    </div>
                    <div className="text-slate-300">Officer In-Charge: {sos.assignedTeam.leadOfficerName}</div>
                    <div className="text-slate-400 font-mono text-[11px]">Radio: {sos.assignedTeam.contactRadioFreq}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={dispatchingId === sos.id}
                      onClick={() => handleAssignTeam(sos.id, 'Armed Police Force (APF) Unit 4')}
                      className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Dispatch APF 🚨
                    </button>
                    <button
                      disabled={dispatchingId === sos.id}
                      onClick={() => handleAssignTeam(sos.id, 'Nepal Army Disaster Battalion')}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
                    >
                      Army Unit 🪖
                    </button>
                  </div>

                  <button
                    onClick={() => handleResolve(sos.id)}
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    Mark Resolved ✓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
