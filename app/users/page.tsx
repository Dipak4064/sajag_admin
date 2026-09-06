'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, PhoneCall, Mic, ShieldAlert, CheckCircle2, AlertCircle, Volume2 } from 'lucide-react';
import { api } from '@/lib/api';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function UsersRosterPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [tally, setTally] = useState<any>({ SAFE: 12, UNSAFE: 3, NO_RESPONSE: 15, total: 30 });
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.success && res.data.data.users?.length > 0) {
        setUsers(res.data.data.users);
        setTally(res.data.data.tally);
      } else {
        fallbackUsers();
      }
    } catch (err) {
      fallbackUsers();
    } finally {
      setLoading(false);
    }
  };

  const fallbackUsers = () => {
    setUsers([
      {
        id: 'u-1',
        name: 'Ram Bahadur Thapa',
        phone: '+977 9801234567',
        status: 'SAFE',
        municipalityId: 'Kathmandu Ward 14',
        responses: [{ message: 'Family evacuated to 2nd floor, water rising slowly', urgency: 'LOW' }]
      },
      {
        id: 'u-2',
        name: 'Sita Devi Shrestha',
        phone: '+977 9841238899',
        status: 'UNSAFE',
        municipalityId: 'Kathmandu Ward 14',
        responses: [{ message: 'Grandmother cannot walk and water entered ground floor room. Need evacuation boat immediately!', urgency: 'CRITICAL' }]
      },
      {
        id: 'u-3',
        name: 'Hari Prasad Sharma',
        phone: '+977 9811445566',
        status: 'NO_RESPONSE',
        municipalityId: 'Kathmandu Ward 12',
        responses: []
      },
      {
        id: 'u-4',
        name: 'Anjali Tamang',
        phone: '+977 9803332211',
        status: 'SAFE',
        municipalityId: 'Kathmandu Ward 10',
        responses: [{ message: 'Reached Dasharath stadium open space safe haven', urgency: 'LOW' }]
      }
    ]);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Resident Safety Roster & Whisper Voice Transcripts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kathmandu Valley population census. Monitors Twilio IVR automated confirmations and transcribed voice distress recordings.
          </p>
        </div>

        {/* Status Breakdown Chips */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <Badge variant="success" className="px-3 py-1 text-xs normal-case rounded-xl">
            Safe: {tally.SAFE}
          </Badge>
          {/* Distress count is red only while somebody is actually unsafe */}
          <Badge
            variant={tally.UNSAFE > 0 ? 'destructive' : 'secondary'}
            className="px-3 py-1 text-xs normal-case rounded-xl"
          >
            Distress: {tally.UNSAFE}
          </Badge>
          <Badge variant="warning" className="px-3 py-1 text-xs normal-case rounded-xl">
            Pending: {tally.NO_RESPONSE}
          </Badge>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] border-b border-white/[0.06] text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4">Resident Name</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4">Location / Ward</th>
                <th className="p-4">Safety Status</th>
                <th className="p-4">Whisper Transcribed Voice / IVR Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    Loading resident safety registry...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    No residents registered.
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                {users.map((u) => {
                  const isSafe = u.status === 'SAFE';
                  const isUnsafe = u.status === 'UNSAFE';
                  const lastResponse = u.responses?.[0];

                  return (
                    <motion.tr
                      key={u.id}
                      layout
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      exit={{ opacity: 0 }}
                      className={`transition-colors ${
                        isUnsafe ? 'bg-red-500/[0.06] hover:bg-red-500/[0.1]' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <td className="p-4 font-bold text-white whitespace-nowrap">{u.name}</td>
                      <td className="p-4 font-mono text-slate-300 whitespace-nowrap">
                        <a href={`tel:${u.phone}`} className="text-cyan-300 hover:text-cyan-200 hover:underline flex items-center gap-1">
                          <PhoneCall className="w-3 h-3" /> {u.phone}
                        </a>
                      </td>
                      <td className="p-4 text-slate-400 whitespace-nowrap">{u.municipalityId || 'Kathmandu Ward 14'}</td>
                      <td className="p-4 whitespace-nowrap">
                        <Badge
                          variant={isSafe ? 'success' : isUnsafe ? 'destructive' : 'warning'}
                          className={isUnsafe ? 'animate-pulse' : ''}
                        >
                          {u.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-300">
                        {lastResponse?.message ? (
                          <div className="flex items-start gap-2 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06] max-w-md">
                            <Mic className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="italic text-[11px]">"{lastResponse.message}"</div>
                              {lastResponse.urgency && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-1 inline-block border ${
                                  lastResponse.urgency === 'CRITICAL'
                                    ? 'border-red-500/40 bg-red-500/15 text-red-300'
                                    : 'border-white/10 bg-white/[0.06] text-slate-400'
                                }`}>
                                  Urgency: {lastResponse.urgency}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">No message recorded</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      </motion.div>
    </motion.div>
  );
}
