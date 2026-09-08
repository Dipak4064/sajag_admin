'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Flame, Waves, Activity, Mountain, WifiOff, CheckCircle2, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { staggerContainer, fadeUp } from '@/lib/motion';
import { Button } from '@/components/ui/button';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimulationModal({ onClose }: SimulationModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const triggerScenario = async (scenario: string, durationSeconds = 120) => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await api.post('/sim/scenario', { scenario, durationSeconds });
      if (res.data.success) {
        setSuccessMsg(`Simulated: ${scenario} event activated!`);
      }
    } catch (err: any) {
      setErrorMsg('Scenario failed. Check that the backend and device simulator are running.');
    } finally {
      setLoading(false);
    }
  };

  const triggerNetworkOutage = async () => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await api.post('/sim/network-mode', { mode: 'LORA_FALLBACK' });
      if (res.data.success) {
        setSuccessMsg('Simulated WiFi outage! Station failed over to LoRa Radio.');
      }
    } catch (err: any) {
      setErrorMsg('Could not switch the simulator to LoRa.');
    } finally {
      setLoading(false);
    }
  };

  const resetAllNormal = async () => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await Promise.all([
        api.post('/sim/scenario', { scenario: 'NORMAL' }),
        api.post('/sim/network-mode', { mode: 'NORMAL' })
      ]);
      setSuccessMsg('System reset to All-Clear Baseline (WiFi MQTT).');
    } catch (err: any) {
      setErrorMsg('Reset failed or only partially completed. Check the simulator and retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[hsl(221_47%_8%)] p-6 shadow-2xl space-y-5"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="font-extrabold text-base text-white">
              DISASTER & OUTAGE SIMULATOR
            </h2>
          </div>
          <motion.div whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} className="inline-flex">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>

        <p className="text-xs text-slate-400">
          Inject real-time disaster anomalies directly into the Virtual ESP32 Simulator.
          Watch the risk engine analyze telemetry and trigger live Twilio notifications.
        </p>

        {errorMsg && <p role="alert" className="text-sm text-red-400">{errorMsg}</p>}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-300"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {/* 1-Click Disaster Scenarios */}
        <motion.div
          variants={staggerContainer(0.06)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {/* Flood */}
          <motion.button
            variants={fadeUp}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            onClick={() => triggerScenario('FLOOD')}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-left space-y-1 transition-colors hover:border-sky-400/50 hover:shadow-glow-blue"
          >
            <Waves className="w-5 h-5 text-sky-400" />
            <div className="font-bold text-xs text-white">Bagmati Flood</div>
            <div className="text-[10px] text-slate-400">Water &gt; 85cm surge, 60mm/h rain</div>
          </motion.button>

          {/* Earthquake */}
          <motion.button
            variants={fadeUp}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            onClick={() => triggerScenario('EARTHQUAKE')}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-left space-y-1 transition-colors hover:border-purple-400/50"
          >
            <Activity className="w-5 h-5 text-purple-400" />
            <div className="font-bold text-xs text-white">Earthquake 6.8M</div>
            <div className="text-[10px] text-slate-400">Accel &gt; 1.8g high tremors</div>
          </motion.button>

          {/* Landslide */}
          <motion.button
            variants={fadeUp}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            onClick={() => triggerScenario('LANDSLIDE')}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-left space-y-1 transition-colors hover:border-amber-400/50 hover:shadow-glow-amber"
          >
            <Mountain className="w-5 h-5 text-amber-400" />
            <div className="font-bold text-xs text-white">Slope Slip</div>
            <div className="text-[10px] text-slate-400">Soil moisture &gt; 90% saturated</div>
          </motion.button>
        </motion.div>

        {/* Hardware & Network Outage Section */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <WifiOff className="w-4 h-4 text-amber-400" /> WiFi Blackout & LoRa Fallback
            </span>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} className="inline-flex">
              <Button
                size="sm"
                disabled={loading}
                onClick={triggerNetworkOutage}
                className="bg-none bg-amber-500 text-slate-950 shadow-glow-amber hover:bg-amber-400"
              >
                Simulate Outage
              </Button>
            </motion.div>
          </div>
          <p className="text-[11px] text-slate-400">
            Cuts WiFi connection. Station fails over to LoRa Radio simulation through the local SimPy gateway.
          </p>
        </div>

        {/* Reset Actions */}
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} className="inline-flex">
            <Button variant="outline" size="sm" disabled={loading} onClick={resetAllNormal}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset All Stations to Normal
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} className="inline-flex">
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
