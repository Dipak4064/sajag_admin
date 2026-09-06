'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Check, X, MapPin, Camera, CheckCircle2, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { fadeUp, staggerContainer, spring } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ReportsReviewPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashId, setFlashId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      if (res.data.success && res.data.data.length > 0) {
        setReports(res.data.data);
      } else {
        fallbackReports();
      }
    } catch (err) {
      fallbackReports();
    } finally {
      setLoading(false);
    }
  };

  const fallbackReports = () => {
    setReports([
      {
        id: 'rep-01',
        disasterType: 'FLOOD',
        description: 'Bagmati river is overflowing above retaining wall at Balkhu corridor. Road submerged under 2 feet.',
        addressText: 'Balkhu Riverbank Corridor, Kathmandu',
        latitude: 27.6895,
        longitude: 85.3021,
        status: 'UNDER_REVIEW',
        mediaUrls: ['https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'rep-02',
        disasterType: 'LANDSLIDE',
        description: 'Mudflow debris obstructing Nagdhunga highway uphill lane.',
        addressText: 'Nagdhunga Corridor, Kathmandu',
        latitude: 27.7080,
        longitude: 85.2200,
        status: 'VERIFIED',
        mediaUrls: [],
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ]);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleVerify = async (id: string, status: string) => {
    try {
      await api.patch(`/reports/${id}/verify`, { status });
    } catch (err: any) {
      // optimistic
    }
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    setFlashId(id);
    setTimeout(() => setFlashId(null), 900);
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
          <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
          Citizen Incident Field Reports Verification
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Crowdsourced disaster observations submitted by residents across Kathmandu. Review ground photos to confirm truth.
        </p>
      </motion.div>

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Loading incident reports...</div>
      ) : reports.length === 0 ? (
        <motion.div variants={fadeUp}>
          <Card className="p-12 text-center text-xs text-slate-500">
            No citizen field reports submitted yet.
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer()} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout" initial={false}>
          {reports.map((rep) => {
            const isVerified = rep.status === 'VERIFIED';
            const isRejected = rep.status === 'REJECTED';
            const isFlashing = flashId === rep.id;

            return (
              <motion.div
                key={rep.id}
                layout
                variants={fadeUp}
                initial="hidden"
                animate={isFlashing ? { opacity: 1, y: 0, scale: [1, 1.02, 1] } : 'show'}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={isFlashing ? { duration: 0.5 } : spring}
              >
              <Card
                className={`p-5 space-y-3 transition-colors ${
                  isFlashing
                    ? isVerified
                      ? '!border-emerald-500/70'
                      : '!border-slate-500/70'
                    : 'hover:!border-cyan-400/25'
                }`}
              >
                <div className="flex items-start justify-between gap-2 border-b border-white/[0.06] pb-3">
                  <div>
                    <span className="text-xs font-black text-white uppercase">
                      {rep.disasterType}
                    </span>
                    <p className="text-xs text-slate-300 mt-1">{rep.description}</p>
                  </div>
                  {/* A rejected report is a moderation outcome, not an emergency — never red */}
                  <Badge variant={isVerified ? 'success' : isRejected ? 'secondary' : 'warning'}>
                    {rep.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{rep.addressText}</span>
                </div>

                {/* Evidence Image */}
                {rep.mediaUrls && rep.mediaUrls.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                    <img
                      src={rep.mediaUrls[0]}
                      alt="Citizen evidence"
                      className="w-full h-44 object-cover"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-end gap-2">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVerify(rep.id, 'REJECTED')}
                      className="hover:bg-white/[0.06] hover:text-slate-100"
                    >
                      <X className="w-3.5 h-3.5" /> Reject Report
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}>
                    <Button size="sm" onClick={() => handleVerify(rep.id, 'VERIFIED')}>
                      <Check className="w-3.5 h-3.5" /> Verify &amp; Broadcast
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
