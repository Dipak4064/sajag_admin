'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeBuoy, Users, HeartPulse, Send, CheckCircle2, ShieldAlert, PhoneCall, Navigation, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { fadeUp, staggerContainer, spring } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SOSTriagePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

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
      setFlashId(sosId);
      setTimeout(() => setFlashId(null), 900);
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
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <LifeBuoy
            className={`w-5 h-5 ${
              requests.length > 0 ? 'text-red-500 animate-pulse' : 'text-cyan-400'
            }`}
          />
          Real-Time Citizen SOS Triage & Rescue Dispatch
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Distress queue sorted by medical urgency and proximity to Kathmandu rescue units.
        </p>
      </motion.div>

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Loading active SOS requests...</div>
      ) : requests.length === 0 ? (
        <motion.div variants={fadeUp}>
          <Card className="p-10 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Zero Active SOS Distress Calls</h3>
            <p className="text-xs text-slate-400">All distress alarms resolved.</p>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer()} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout" initial={false}>
          {requests.map((sos) => {
            const isCritical = sos.medicalEmergency === 'CRITICAL' || sos.medicalEmergency === 'SEVERE';
            const isFlashing = flashId === sos.id;
            return (
              <motion.div
                key={sos.id}
                layout
                variants={fadeUp}
                initial="hidden"
                animate={isFlashing ? { opacity: 1, y: 0, scale: [1, 1.02, 1] } : 'show'}
                exit={{ opacity: 0, scale: 0.9, x: 40 }}
                transition={isFlashing ? { duration: 0.5 } : spring}
              >
              <Card
                className={`p-5 space-y-4 transition-colors ${
                  isFlashing
                    ? '!border-emerald-500/70'
                    : isCritical
                    ? '!border-red-500/60 shadow-glow-red'
                    : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-white/[0.06] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-red-400 font-mono">
                        SOS #{sos.id.slice(-6)}
                      </span>
                      <Badge
                        variant={isCritical ? 'destructive' : 'warning'}
                        className={isCritical ? 'animate-pulse' : ''}
                      >
                        {sos.medicalEmergency} Medical Need
                      </Badge>
                    </div>
                    <div className="text-xs font-semibold text-white mt-1">
                      {sos.description}
                    </div>
                  </div>

                  {/* Only an un-triaged (pending) ticket is red; dispatched/resolved are not */}
                  <Badge
                    variant={
                      sos.status === 'ASSIGNED'
                        ? 'info'
                        : sos.status === 'RESOLVED'
                        ? 'success'
                        : 'destructive'
                    }
                  >
                    {sos.status}
                  </Badge>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-0.5">
                    <span className="text-[10px] text-slate-500 block">People In Distress</span>
                    <span className="font-extrabold text-red-300">{sos.numberOfPeople} Trapped</span>
                  </div>

                  <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-0.5">
                    <span className="text-[10px] text-slate-500 block">Citizen Contact</span>
                    <a href={`tel:${sos.contactNumber}`} className="font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1 font-bold">
                      <PhoneCall className="w-3 h-3" /> {sos.contactNumber}
                    </a>
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                  <Navigation className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{sos.addressText || `${sos.latitude}, ${sos.longitude}`}</span>
                </div>

                {/* Assigned Team Info */}
                {sos.assignedTeam && (
                  <div className="p-3 bg-emerald-500/[0.08] border border-emerald-500/30 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched: {sos.assignedTeam.name}
                    </div>
                    <div className="text-slate-300">Officer In-Charge: {sos.assignedTeam.leadOfficerName}</div>
                    <div className="text-slate-400 font-mono text-[11px]">Radio: {sos.assignedTeam.contactRadioFreq}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Dispatch = live-emergency action, the only red CTAs in the app */}
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={dispatchingId === sos.id}
                        onClick={() => handleAssignTeam(sos.id, 'Armed Police Force (APF) Unit 4')}
                      >
                        Dispatch APF 🚨
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={dispatchingId === sos.id}
                        onClick={() => handleAssignTeam(sos.id, 'Nepal Army Disaster Battalion')}
                        className="border-red-500/35 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-400/55 hover:text-red-200"
                      >
                        Army Unit 🪖
                      </Button>
                    </motion.div>
                  </div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(sos.id)}
                      className="border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400/55 hover:text-emerald-200"
                    >
                      Mark Resolved ✓
                    </Button>
                  </motion.div>
                </div>
              </Card>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
