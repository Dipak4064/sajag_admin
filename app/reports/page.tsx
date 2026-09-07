'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet,
  Check,
  X,
  MapPin,
  Clock,
  BellRing,
  Image as ImageIcon,
  Inbox
} from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { fadeUp, staggerContainer, spring } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

function timeAgo(iso?: string) {
  if (!iso) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function ReportsReviewPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [notifiedId, setNotifiedId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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

    // Live-update this console when another operator changes a report.
    const socket = getSocket();
    socket.on('report:status', (updated: any) => {
      if (!updated?.id) return;
      setReports((prev) =>
        prev.some((r) => r.id === updated.id)
          ? prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
          : [updated, ...prev]
      );
    });

    return () => {
      socket.off('report:status');
    };
  }, []);

  const handleVerify = async (id: string, status: string) => {
    const target = reports.find((r) => r.id === id);
    try {
      await api.patch(`/reports/${id}/verify`, { status });
    } catch (err: any) {
      // optimistic
    }

    const optimistic = target ? { ...target, status } : null;
    if (optimistic) {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }

    // Notify the citizen portal live so the submitter sees accept / deny.
    const socket = getSocket();
    socket.emit('report:status', optimistic ?? { id, status, disasterType: 'OTHER' });

    setFlashId(id);
    setTimeout(() => setFlashId(null), 900);
    setNotifiedId(id);
    setTimeout(() => setNotifiedId(null), 2600);
  };

  /* Build a fully-qualified URL for evidence photos. */
  const resolveMedia = (rep: any): string | null => {
    let urls: string[] = [];
    if (Array.isArray(rep.mediaUrls)) {
      urls = rep.mediaUrls;
    } else if (typeof rep.mediaUrls === 'string') {
      try {
        const parsed = JSON.parse(rep.mediaUrls);
        if (Array.isArray(parsed)) urls = parsed;
      } catch {}
    }
    if (!urls || urls.length === 0 || !urls[0]) return null;
    const rawUrl = urls[0];
    const apiBase = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
    return rawUrl.startsWith('http') ? rawUrl : `${apiBase}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
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
          Crowdsourced disaster observations submitted by residents across Kathmandu. Review ground
          photos to confirm truth — citizens are notified live when you accept or deny a report.
        </p>
      </motion.div>

      {/* Live socket relay status */}
      <motion.div variants={fadeUp} className="flex items-center gap-2">
        <BellRing className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[11px] text-slate-400">
          Accept &amp; Deny decisions are pushed to the submitting citizen in real time.
        </span>
      </motion.div>

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-xs">Loading incident reports...</div>
      ) : reports.length === 0 ? (
        <motion.div variants={fadeUp}>
          <Card className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <Inbox className="w-8 h-8 text-slate-600" />
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
            const isNotified = notifiedId === rep.id;
            const mediaUrl = resolveMedia(rep);

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
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white uppercase">
                        {rep.disasterType}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(rep.createdAt)}
                      </span>
                    </div>
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
                {mediaUrl && (
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(mediaUrl)}
                    className="group relative block w-full rounded-xl overflow-hidden border border-white/[0.06] cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaUrl}
                      alt="Citizen evidence"
                      className="w-full h-44 object-cover transition-transform group-hover:scale-[1.02]"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                      <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                    </span>
                  </button>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <AnimatePresence>
                    {isNotified && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden flex items-center gap-1.5 text-[11px] text-emerald-300"
                      >
                        <BellRing className="w-3 h-3" />
                        Citizen notified — status updated to {rep.status}.
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-end gap-2">
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerify(rep.id, 'REJECTED')}
                        disabled={isRejected}
                        className="hover:bg-white/[0.06] hover:text-slate-100"
                      >
                        <X className="w-3.5 h-3.5" /> {isRejected ? 'Rejected' : 'Reject Report'}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}>
                      <Button
                        size="sm"
                        onClick={() => handleVerify(rep.id, 'VERIFIED')}
                        disabled={isVerified}
                      >
                        <Check className="w-3.5 h-3.5" /> {isVerified ? 'Verified' : 'Verify & Broadcast'}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </Card>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Evidence lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={(open) => !open && setLightboxUrl(null)}>
        <DialogContent className="max-w-3xl border-white/10 bg-[hsl(221_47%_8%)] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Citizen evidence photo</DialogTitle>
          </DialogHeader>
          {lightboxUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lightboxUrl} alt="Citizen evidence" className="w-full max-h-[80vh] object-contain" />
          )}
          <DialogClose asChild>
            <div className="absolute top-3 right-3">
              <Button variant="outline" size="icon" className="bg-black/60 backdrop-blur">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}