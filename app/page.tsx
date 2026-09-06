'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Radio,
  LifeBuoy,
  Users,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Waves,
  Activity,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import LiveMap from '@/components/map/live-map';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { fadeUp, fadeIn, scaleIn, staggerContainer, spring } from '@/lib/motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function CommandCenterOverview() {
  const [devices, setDevices] = useState<any[]>([]);
  const [disasters, setDisasters] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [sosList, setSosList] = useState<any[]>([]);
  const [userTally, setUserTally] = useState({ SAFE: 0, UNSAFE: 0, NO_RESPONSE: 0, total: 30 });
  const [latestReadings, setLatestReadings] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [devRes, disRes, userRes, shelterRes, sosRes] = await Promise.all([
        api.get('/devices'),
        api.get('/alerts/active'),
        api.get('/users'),
        api.get('/shelters'),
        api.get('/sos/active')
      ]);

      if (devRes.data.success) setDevices(devRes.data.data);
      if (disRes.data.success) setDisasters(disRes.data.data);
      if (userRes.data.success) {
        setUsers(userRes.data.data.users);
        setUserTally(userRes.data.data.tally);
      }
      if (shelterRes.data.success) setShelters(shelterRes.data.data);
      if (sosRes.data.success) setSosList(sosRes.data.data);
    } catch (err) {
      // If backend is booting, provide Kathmandu stations fallback
      fallbackInit();
    } finally {
      setIsRefreshing(false);
    }
  };

  const fallbackInit = () => {
    setDevices([
      { id: 'dev-1', deviceId: 'ESP32_BALKHU_01', name: 'Balkhu River Station', latitude: 27.6895, longitude: 85.3021, status: 'ONLINE', transport: 'MQTT' },
      { id: 'dev-2', deviceId: 'ESP32_SUNDARIJAL_02', name: 'Sundarijal Water Gate', latitude: 27.7667, longitude: 85.4167, status: 'ONLINE', transport: 'MQTT' },
      { id: 'dev-3', deviceId: 'ESP32_KIRTIPUR_03', name: 'Kirtipur Slope Station', latitude: 27.6800, longitude: 85.2850, status: 'ONLINE', transport: 'MQTT' },
      { id: 'dev-4', deviceId: 'ESP32_THAMEL_04', name: 'Thamel Urban Core', latitude: 27.7154, longitude: 85.3123, status: 'ONLINE', transport: 'MQTT' },
      { id: 'dev-5', deviceId: 'ESP32_CHOBHAR_05', name: 'Chobhar Gorge Outlet', latitude: 27.6610, longitude: 85.2920, status: 'ONLINE', transport: 'LORA_SIM' },
      { id: 'dev-6', deviceId: 'ESP32_NAGDHUNGA_06', name: 'Nagdhunga Corridor', latitude: 27.7080, longitude: 85.2200, status: 'ONLINE', transport: 'LORA_SIM' }
    ]);
    setDisasters([
      { id: 'd-1', type: 'FLOOD', riskScore: 78, severity: 'CRITICAL', latitude: 27.6895, longitude: 85.3021, radiusMeters: 4500, status: 'CONFIRMED', description: 'Bagmati water surge at Balkhu corridor.' }
    ]);
    setSosList([
      { id: 'sos-101', latitude: 27.6895, longitude: 85.3021, description: 'Family trapped on roof near Balkhu bridge.', numberOfPeople: 4, medicalEmergency: 'CRITICAL', status: 'PENDING', contactNumber: '+977 9801122334' }
    ]);
  };

  useEffect(() => {
    fetchData();

    const socket = getSocket();

    socket.on('reading:new', (reading: any) => {
      setLatestReadings((prev) => [reading, ...prev.slice(0, 15)]);
      setDevices((prev) =>
        prev.map((d) => (d.id === reading.deviceId ? { ...d, readings: [reading] } : d))
      );
    });

    socket.on('device:status', ({ deviceId, status, transport }) => {
      setDevices((prev) =>
        prev.map((d) => (d.deviceId === deviceId ? { ...d, status, transport } : d))
      );
    });

    socket.on('alert:new', (event: any) => {
      setDisasters((prev) => [event, ...prev]);
    });

    socket.on('sos:new', (sos: any) => {
      setSosList((prev) => [sos, ...prev]);
    });

    socket.on('response:new', () => {
      fetchData();
    });

    return () => {
      socket.off('reading:new');
      socket.off('device:status');
      socket.off('alert:new');
      socket.off('sos:new');
      socket.off('response:new');
    };
  }, []);

  const loraCount = devices.filter((d) => d.transport === 'LORA_SIM').length;

  return (
    <div className="space-y-5">
      {/* 4 KPI Stat Tiles */}
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Tile 1: Active Hazards — RED only while a hazard is actually live */}
        <motion.div variants={fadeUp}>
        <Card
          className={`p-4 space-y-2 transition-colors ${
            disasters.length > 0 ? '!border-red-500/45 shadow-glow-red' : ''
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Hazards</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                disasters.length > 0 ? 'text-red-500 animate-pulse' : 'text-slate-500'
              }`}
            />
          </div>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={disasters.length}
              initial={{ opacity: 0, scale: 0.85, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={spring}
              className="text-3xl font-black text-white"
            >
              {disasters.length}
            </motion.div>
          </AnimatePresence>
          <div
            className={`text-[11px] font-medium ${
              disasters.length > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {disasters.length > 0 ? `${disasters[0].severity} Alert In Effect` : 'Basins Normal'}
          </div>
        </Card>
        </motion.div>

        {/* Tile 2: SOS Distress — RED only while distress tickets are pending */}
        <motion.div variants={fadeUp}>
        <Card
          className={`p-4 space-y-2 transition-colors ${
            sosList.length > 0 ? '!border-red-500/45 shadow-glow-red' : ''
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending SOS</span>
            <LifeBuoy
              className={`w-4 h-4 ${
                sosList.length > 0 ? 'text-red-500 animate-pulse' : 'text-slate-500'
              }`}
            />
          </div>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={sosList.length}
              initial={{ opacity: 0, scale: 0.85, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={spring}
              className="text-3xl font-black text-white"
            >
              {sosList.length}
            </motion.div>
          </AnimatePresence>
          <div
            className={`text-[11px] font-medium ${
              sosList.length > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {sosList.length > 0 ? 'Immediate Rescue Triage Required' : 'No Distress Calls'}
          </div>
        </Card>
        </motion.div>

        {/* Tile 3: IoT Stations */}
        <motion.div variants={fadeUp}>
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">IoT Stations (Kathmandu)</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={devices.length}
              initial={{ opacity: 0, scale: 0.85, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={spring}
              className="text-3xl font-black text-white"
            >
              {devices.length || 8}
            </motion.div>
          </AnimatePresence>
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span className="text-sky-400 font-bold">WiFi: {devices.length - loraCount}</span>
            <span className="text-amber-400 font-bold">LoRa Radio: {loraCount}</span>
          </div>
        </Card>
        </motion.div>

        {/* Tile 4: Resident Safety Tally */}
        <motion.div variants={fadeUp}>
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Citizen Safety Tally</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`safe-${userTally.SAFE}`}
                initial={{ opacity: 0, scale: 0.85, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={spring}
                className="text-3xl font-black text-emerald-400"
              >
                {userTally.SAFE}
              </motion.span>
            </AnimatePresence>
            <span className="text-xs text-slate-400">Safe</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`unsafe-${userTally.UNSAFE}`}
                initial={{ opacity: 0, scale: 0.85, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={spring}
                className={`text-3xl font-black ml-2 ${
                  userTally.UNSAFE > 0 ? 'text-red-400' : 'text-slate-500'
                }`}
              >
                {userTally.UNSAFE}
              </motion.span>
            </AnimatePresence>
            <span className="text-xs text-slate-400">Distress</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {userTally.NO_RESPONSE} Unverified / Pending response
          </div>
        </Card>
        </motion.div>
      </motion.div>

      {/* Main Tactical Split Screen */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {/* Left 2 Cols: GIS Tactical Map */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          <div className="grid-overlay p-3.5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.03]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">
                Tactical GIS Situational Display
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <motion.div whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.08 }} transition={spring}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchData}
                  disabled={isRefreshing}
                  className="h-7 w-7 text-slate-400 hover:text-cyan-300"
                  title="Refresh GIS Layers"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </motion.div>
            </div>
          </div>

          <div className="h-[480px] w-full">
            <LiveMap
              devices={devices}
              disasters={disasters}
              users={users}
              shelters={shelters}
              sosList={sosList}
            />
          </div>

          {/* Map Layer Legend */}
          <div className="p-2.5 bg-white/[0.02] border-t border-white/[0.06] flex flex-wrap items-center justify-around gap-x-3 gap-y-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-sky-400">📶 WiFi Station</span>
            <span className="flex items-center gap-1 text-amber-400">📡 LoRa Station</span>
            <span className="flex items-center gap-1 text-red-400">🚨 Red Geofence = Hazard</span>
            <span className="flex items-center gap-1 text-red-400">🆘 SOS Distress Call</span>
            <span className="flex items-center gap-1 text-emerald-400">⛺ Safe Shelter Haven</span>
          </div>
        </Card>

        {/* Right 1 Col: Live SOS Triage & Telemetry Stream */}
        <div className="space-y-4">
          {/* SOS Triage Queue */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <LifeBuoy
                  className={`w-4 h-4 ${
                    sosList.length > 0 ? 'text-red-500 animate-pulse' : 'text-slate-500'
                  }`}
                />
                Live SOS Queue
              </span>
              <Link href="/sos" className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-0.5 font-bold">
                View All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin-slate">
              {sosList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">No active SOS alarms.</div>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {sosList.map((sos) => (
                    <motion.div
                      key={sos.id}
                      layout
                      initial={{ opacity: 0, x: 24, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={spring}
                      className="p-3 bg-red-500/[0.07] border border-red-500/30 hover:border-red-500/70 rounded-xl space-y-1.5 text-xs transition-colors"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-red-400 flex items-center gap-1">
                          🆘 SOS #{sos.id.slice(-4)}
                        </span>
                        <Badge variant="destructive">{sos.medicalEmergency}</Badge>
                      </div>
                      <p className="text-slate-300 text-[11px] line-clamp-2">{sos.description}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-red-500/20 text-[10px] text-slate-400">
                        <span>Trapped: {sos.numberOfPeople}</span>
                        <a href={`tel:${sos.contactNumber}`} className="text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5 font-mono">
                          <PhoneCall className="w-2.5 h-2.5" /> Call
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </Card>

          {/* IoT Live Sensor Telemetry Stream */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-cyan-400" />
                IoT Telemetry Stream
              </span>
              <Link href="/devices" className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-0.5 font-bold">
                Telemetry Matrix <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 font-mono text-[11px] scrollbar-thin-slate">
              {latestReadings.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 font-sans">
                  Listening for virtual sensor telemetry...
                </div>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {latestReadings.map((r, idx) => (
                    <motion.div
                      key={`${r.deviceId}-${r.timestamp || idx}`}
                      layout
                      initial={{ opacity: 0, x: 24, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={spring}
                      className="p-2 bg-white/[0.03] border border-white/[0.06] rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{r.deviceId}</div>
                        <div className="text-[10px] text-slate-400">
                          W: {r.waterLevel}cm | A: {r.acceleration}g | R: {r.rainfall}mm
                        </div>
                      </div>
                      <Badge variant={r.transport === 'LORA_SIM' ? 'warning' : 'info'}>
                        {r.transport}
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
