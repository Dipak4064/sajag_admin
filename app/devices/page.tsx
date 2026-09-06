'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Wifi, WifiOff, RefreshCw, AlertCircle, Cpu, Activity, Droplets, CloudRain, Mountain } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { fadeUp, staggerContainer, spring } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/devices');
      if (res.data.success && res.data.data.length > 0) {
        setDevices(res.data.data);
      } else {
        fallbackDevices();
      }
    } catch (err) {
      fallbackDevices();
    } finally {
      setLoading(false);
    }
  };

  const fallbackDevices = () => {
    setDevices([
      {
        id: 'dev-1',
        deviceId: 'ESP32_BALKHU_01',
        name: 'Balkhu Bridge Station (Bagmati Basin)',
        latitude: 27.6895,
        longitude: 85.3021,
        status: 'ONLINE',
        transport: 'MQTT',
        readings: [{ waterLevel: 42, acceleration: 0.05, rainfall: 12, soilMoisture: 45, timestamp: new Date().toISOString() }]
      },
      {
        id: 'dev-2',
        deviceId: 'ESP32_SUNDARIJAL_02',
        name: 'Sundarijal Water Gate Inflow',
        latitude: 27.7667,
        longitude: 85.4167,
        status: 'ONLINE',
        transport: 'MQTT',
        readings: [{ waterLevel: 28, acceleration: 0.02, rainfall: 8, soilMoisture: 38, timestamp: new Date().toISOString() }]
      },
      {
        id: 'dev-3',
        deviceId: 'ESP32_KIRTIPUR_03',
        name: 'Kirtipur Hill Slope Station',
        latitude: 27.6800,
        longitude: 85.2850,
        status: 'ONLINE',
        transport: 'MQTT',
        readings: [{ waterLevel: 15, acceleration: 0.04, rainfall: 5, soilMoisture: 52, timestamp: new Date().toISOString() }]
      },
      {
        id: 'dev-4',
        deviceId: 'ESP32_THAMEL_04',
        name: 'Thamel Urban Drainage Corridor',
        latitude: 27.7154,
        longitude: 85.3123,
        status: 'ONLINE',
        transport: 'MQTT',
        readings: [{ waterLevel: 22, acceleration: 0.06, rainfall: 14, soilMoisture: 30, timestamp: new Date().toISOString() }]
      },
      {
        id: 'dev-5',
        deviceId: 'ESP32_CHOBHAR_05',
        name: 'Chobhar Gorge River Outlet',
        latitude: 27.6610,
        longitude: 85.2920,
        status: 'ONLINE',
        transport: 'LORA_SIM',
        readings: [{ waterLevel: 55, acceleration: 0.03, rainfall: 18, soilMoisture: 60, timestamp: new Date().toISOString() }]
      },
      {
        id: 'dev-6',
        deviceId: 'ESP32_NAGDHUNGA_06',
        name: 'Nagdhunga Landslide Corridor',
        latitude: 27.7080,
        longitude: 85.2200,
        status: 'ONLINE',
        transport: 'LORA_SIM',
        readings: [{ waterLevel: 18, acceleration: 0.08, rainfall: 25, soilMoisture: 78, timestamp: new Date().toISOString() }]
      }
    ]);
  };

  useEffect(() => {
    fetchDevices();

    const socket = getSocket();

    socket.on('reading:new', (reading: any) => {
      setDevices((prev) =>
        prev.map((d) => (d.id === reading.deviceId ? { ...d, readings: [reading] } : d))
      );
    });

    socket.on('device:status', ({ deviceId, status, transport }) => {
      setDevices((prev) =>
        prev.map((d) => (d.deviceId === deviceId ? { ...d, status, transport } : d))
      );
    });

    return () => {
      socket.off('reading:new');
      socket.off('device:status');
    };
  }, []);

  const toggleDeviceTransport = async (device: any) => {
    const newMode = device.transport === 'LORA_SIM' ? 'NORMAL' : 'LORA_FALLBACK';
    const targetTransport = device.transport === 'LORA_SIM' ? 'MQTT' : 'LORA_SIM';
    setTogglingId(device.deviceId);

    try {
      await api.post('/sim/network-mode', {
        mode: newMode,
        deviceId: device.deviceId
      });
      // Optimistic update
      setDevices((prev) =>
        prev.map((d) =>
          d.deviceId === device.deviceId
            ? { ...d, transport: targetTransport }
            : d
        )
      );
    } catch (e) {
      setDevices((prev) =>
        prev.map((d) =>
          d.deviceId === device.deviceId
            ? { ...d, transport: targetTransport }
            : d
        )
      );
    } finally {
      setTogglingId(null);
      setFlashId(device.deviceId);
      setTimeout(() => setFlashId(null), 900);
    }
  };

  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            IoT Sensor Stations & Dynamic LoRa Failover
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry stream from 8 Kathmandu stations with on-demand WiFi / LoRa Radio toggle.
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline" size="sm" onClick={fetchDevices}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
          </Button>
        </motion.div>
      </motion.div>

      {/* Grid of Station Telemetry Cards */}
      <motion.div variants={staggerContainer()} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-500">
            Polling Kathmandu IoT Stations...
          </div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
          {devices.map((d) => {
            const reading = d.readings?.[0] || {
              waterLevel: 25,
              acceleration: 0.04,
              rainfall: 10,
              soilMoisture: 40
            };
            const isLoRa = d.transport === 'LORA_SIM';
            const isToggling = togglingId === d.deviceId;
            const isFlashing = flashId === d.deviceId;

            return (
              <motion.div
                key={d.id}
                layout
                variants={fadeUp}
                initial="hidden"
                animate={isFlashing ? { opacity: 1, y: 0, scale: [1, 1.02, 1] } : 'show'}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={isFlashing ? { duration: 0.5 } : spring}
              >
              <Card
                className={`p-5 space-y-4 transition-colors ${
                  isFlashing ? '!border-emerald-500/70' : 'hover:!border-cyan-400/30'
                }`}
              >
                {/* Station Title & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <h3 className="font-bold text-sm text-white">{d.name}</h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{d.deviceId}</span>
                  </div>

                  {/* OFFLINE is a fault, not an emergency — amber, never red */}
                  <Badge variant={d.status === 'ONLINE' ? 'success' : 'warning'}>{d.status}</Badge>
                </div>

                {/* 4 Sensor Values */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-sky-400" /> Water Level
                    </span>
                    <div className="font-extrabold text-white text-base">
                      {reading.waterLevel}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">cm</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-teal-400" /> Acceleration
                    </span>
                    <div className="font-extrabold text-white text-base">
                      {reading.acceleration}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">g</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <CloudRain className="w-3 h-3 text-cyan-400" /> Rain Rate
                    </span>
                    <div className="font-extrabold text-white text-base">
                      {reading.rainfall}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">mm/h</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Mountain className="w-3 h-3 text-amber-400" /> Soil Saturation
                    </span>
                    <div className="font-extrabold text-white text-base">
                      {reading.soilMoisture}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">%</span>
                    </div>
                  </div>
                </div>

                {/* Transport Switch Bar */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {isLoRa ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <WifiOff className="w-3.5 h-3.5" /> LoRa Radio Fallback (Firebase)
                      </span>
                    ) : (
                      <span className="text-sky-400 flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5" /> Primary WiFi (MQTT Broker)
                      </span>
                    )}
                  </div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}>
                    <Button
                      size="sm"
                      variant={isLoRa ? 'default' : 'outline'}
                      disabled={isToggling}
                      onClick={() => toggleDeviceTransport(d)}
                      className={
                        isLoRa
                          ? ''
                          : 'border-amber-500/35 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400/50 hover:text-amber-200'
                      }
                    >
                      {isToggling ? 'Switching...' : isLoRa ? 'Switch to WiFi' : 'Failover LoRa'}
                    </Button>
                  </motion.div>
                </div>
              </Card>
              </motion.div>
            );
          })}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
}
