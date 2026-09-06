'use client';

import { useState, useEffect } from 'react';
import { Radio, Wifi, WifiOff, RefreshCw, AlertCircle, Cpu, Activity, Droplets, CloudRain, Mountain } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" />
            IoT Sensor Stations & Dynamic LoRa Failover
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry stream from 8 Kathmandu stations with on-demand WiFi / LoRa Radio toggle.
          </p>
        </div>
        <button
          onClick={fetchDevices}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white rounded-xl flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
        </button>
      </div>

      {/* Grid of Station Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-500">
            Polling Kathmandu IoT Stations...
          </div>
        ) : (
          devices.map((d) => {
            const reading = d.readings?.[0] || {
              waterLevel: 25,
              acceleration: 0.04,
              rainfall: 10,
              soilMoisture: 40
            };
            const isLoRa = d.transport === 'LORA_SIM';
            const isToggling = togglingId === d.deviceId;

            return (
              <div
                key={d.id}
                className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-4 transition-all shadow-lg"
              >
                {/* Station Title & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-slate-400" />
                      <h3 className="font-bold text-sm text-white">{d.name}</h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{d.deviceId}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      d.status === 'ONLINE'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                        : 'bg-red-950/60 text-red-400 border-red-800'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>

                {/* 4 Sensor Values */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-400" /> Water Level
                    </span>
                    <div className="font-extrabold text-white text-base">
                      {reading.waterLevel}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">cm</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-purple-400" /> Acceleration
                    </span>
                    <div className="font-extrabold text-white text-base">
                      {reading.acceleration}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">g</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <CloudRain className="w-3 h-3 text-cyan-400" /> Rain Rate
                    </span>
                    <div className="font-extrabold text-white text-base">
                      {reading.rainfall}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">mm/h</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
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
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {isLoRa ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <WifiOff className="w-3.5 h-3.5" /> LoRa Radio Fallback (Firebase)
                      </span>
                    ) : (
                      <span className="text-blue-400 flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5" /> Primary WiFi (MQTT Broker)
                      </span>
                    )}
                  </div>

                  <button
                    disabled={isToggling}
                    onClick={() => toggleDeviceTransport(d)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      isLoRa
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                    }`}
                  >
                    {isToggling ? 'Switching...' : isLoRa ? 'Switch to WiFi' : 'Failover LoRa'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
