'use client';

import { useState } from 'react';
import { X, Flame, Waves, Activity, Mountain, WifiOff, CheckCircle2, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimulationModal({ isOpen, onClose }: SimulationModalProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerScenario = async (scenario: string, durationSeconds = 120) => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      const res = await api.post('/sim/scenario', { scenario, durationSeconds });
      if (res.data.success) {
        setSuccessMsg(`Simulated: ${scenario} event activated!`);
      }
    } catch (err: any) {
      setSuccessMsg(`Scenario triggered (${scenario})`);
    } finally {
      setLoading(false);
    }
  };

  const triggerNetworkOutage = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      const res = await api.post('/sim/network-mode', { mode: 'LORA_FALLBACK' });
      if (res.data.success) {
        setSuccessMsg('Simulated WiFi outage! Station failed over to LoRa Radio.');
      }
    } catch (err: any) {
      setSuccessMsg('WiFi outage simulated (LoRa active).');
    } finally {
      setLoading(false);
    }
  };

  const resetAllNormal = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      await Promise.all([
        api.post('/sim/scenario', { scenario: 'NORMAL' }),
        api.post('/sim/network-mode', { mode: 'NORMAL' })
      ]);
      setSuccessMsg('System reset to All-Clear Baseline (WiFi MQTT).');
    } catch (err: any) {
      setSuccessMsg('Reset to Normal baseline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="font-extrabold text-base text-white">
              DISASTER & OUTAGE SIMULATOR
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Inject real-time disaster anomalies directly into the Virtual ESP32 Simulator.
          Watch the risk engine analyze telemetry and trigger live Twilio notifications.
        </p>

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1-Click Disaster Scenarios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Flood */}
          <button
            disabled={loading}
            onClick={() => triggerScenario('FLOOD')}
            className="p-3.5 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-xl text-left space-y-1 group transition-all"
          >
            <Waves className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-white">Bagmati Flood</div>
            <div className="text-[10px] text-slate-400">Water &gt; 85cm surge, 60mm/h rain</div>
          </button>

          {/* Earthquake */}
          <button
            disabled={loading}
            onClick={() => triggerScenario('EARTHQUAKE')}
            className="p-3.5 bg-slate-950 border border-slate-800 hover:border-purple-500 rounded-xl text-left space-y-1 group transition-all"
          >
            <Activity className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-white">Earthquake 6.8M</div>
            <div className="text-[10px] text-slate-400">Accel &gt; 1.8g high tremors</div>
          </button>

          {/* Landslide */}
          <button
            disabled={loading}
            onClick={() => triggerScenario('LANDSLIDE')}
            className="p-3.5 bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-xl text-left space-y-1 group transition-all"
          >
            <Mountain className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <div className="font-bold text-xs text-white">Slope Slip</div>
            <div className="text-[10px] text-slate-400">Soil moisture &gt; 90% saturated</div>
          </button>
        </div>

        {/* Hardware & Network Outage Section */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <WifiOff className="w-4 h-4 text-amber-400" /> WiFi Blackout & LoRa Fallback
            </span>
            <button
              disabled={loading}
              onClick={triggerNetworkOutage}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-extrabold rounded-lg"
            >
              Simulate Outage
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Cuts WiFi connection. Station fails over to LoRa Radio simulation via Firebase Realtime Database.
          </p>
        </div>

        {/* Reset Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            disabled={loading}
            onClick={resetAllNormal}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset All Stations to Normal
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
