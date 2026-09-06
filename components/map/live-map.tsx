'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/motion';

// Dynamically import Leaflet components with SSR disabled
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

interface LiveMapProps {
  devices?: any[];
  disasters?: any[];
  users?: any[];
  shelters?: any[];
  sosList?: any[];
  onSelectDevice?: (deviceId: string) => void;
}

export default function LiveMap({
  devices = [],
  disasters = [],
  users = [],
  shelters = [],
  sosList = [],
  onSelectDevice
}: LiveMapProps) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      setMounted(true);
    });
  }, []);

  if (!mounted || !L) {
    return (
      <div className="grid-overlay w-full h-full min-h-[480px] bg-[hsl(222_48%_5%)] flex items-center justify-center text-cyan-300/70 text-sm">
        Loading GIS Tactical Operations Map...
      </div>
    );
  }

  // Custom Leaflet SVG DivIcons
  const createSensorIcon = (transport: string) => {
    const isLoRa = transport === 'LORA_SIM';
    return L.divIcon({
      className: 'custom-sensor-icon',
      html: `
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #0c1526;
          border: 3px ${isLoRa ? 'dashed #f59e0b' : 'solid #22d3ee'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          box-shadow: 0 0 10px ${isLoRa ? 'rgba(245, 158, 11, 0.55)' : 'rgba(34, 211, 238, 0.6)'};
        ">
          ${isLoRa ? '📡' : '📶'}
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  const createSOSIcon = () =>
    L.divIcon({
      className: 'custom-sos-icon',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ef4444;
          border: 3px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.28), 0 0 22px rgba(239, 68, 68, 0.95);
          animation: pulse 1.5s infinite;
        ">
          🆘
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

  const createShelterIcon = () =>
    L.divIcon({
      className: 'custom-shelter-icon',
      html: `
        <div style="
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: #10b981;
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        ">
          ⛺
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

  const createUserIcon = (status: string) => {
    let bg = '#10b981';
    let symbol = '✓';
    if (status === 'UNSAFE') {
      bg = '#ef4444';
      symbol = '!';
    } else if (status === 'NO_RESPONSE') {
      bg = '#f59e0b';
      symbol = '?';
    }

    return L.divIcon({
      className: 'custom-user-icon',
      html: `
        <div style="
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${bg};
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          color: white;
        ">
          ${symbol}
        </div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="show"
      className="w-full h-full min-h-[480px] relative z-0"
    >
      {/* @ts-ignore */}
      <MapContainer
        center={[27.700769, 85.30014]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Dark CartoDB Matter Tile Layer */}
        {/* @ts-ignore */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* 1. IoT Sensor Stations */}
        {devices.map((device) => (
          <Marker
            key={device.id}
            position={[device.latitude, device.longitude]}
            icon={createSensorIcon(device.transport)}
            eventHandlers={{
              click: () => onSelectDevice && onSelectDevice(device.id)
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 space-y-1 font-sans text-slate-100">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
                  <span className="font-extrabold text-xs text-white">{device.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                      device.status === 'ONLINE'
                        ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                        : 'border-amber-500/35 bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {device.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  ID: <span className="font-mono text-cyan-300">{device.deviceId}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Network:{' '}
                  <span
                    className={`font-semibold ${
                      device.transport === 'LORA_SIM' ? 'text-amber-400' : 'text-sky-400'
                    }`}
                  >
                    {device.transport === 'LORA_SIM' ? 'LoRa Fallback 📡' : 'WiFi MQTT 📶'}
                  </span>
                </div>
                {device.readings && device.readings.length > 0 && (
                  <div className="pt-1 text-[10px] text-slate-300 grid grid-cols-2 gap-1 border-t border-white/10">
                    <span>Water: {device.readings[0].waterLevel} cm</span>
                    <span>Accel: {device.readings[0].acceleration} g</span>
                    <span>Rain: {device.readings[0].rainfall} mm/h</span>
                    <span>Soil: {device.readings[0].soilMoisture}%</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 2. Disasters & Dynamic Danger Geofence Circles */}
        {disasters.map((disaster) => (
          <Circle
            key={disaster.id}
            center={[disaster.latitude, disaster.longitude]}
            radius={disaster.radiusMeters || 3000}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.25,
              weight: 2,
              dashArray: '5, 10'
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 text-slate-100 font-sans">
                <div className="font-bold text-red-400 text-xs uppercase">
                  🚨 {disaster.type} ({disaster.severity})
                </div>
                <div className="text-[11px] mt-1 text-slate-300">{disaster.description}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Risk Score: {disaster.riskScore} | Radius: {((disaster.radiusMeters || 3000) / 1000).toFixed(1)} km
                </div>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* 3. Safe Shelters */}
        {shelters.map((shelter) => (
          <Marker
            key={shelter.id}
            position={[shelter.latitude, shelter.longitude]}
            icon={createShelterIcon()}
          >
            <Popup className="custom-popup">
              <div className="p-1 text-slate-100 font-sans">
                <div className="font-bold text-xs text-emerald-400">🏕️ {shelter.name}</div>
                <div className="text-[11px] text-slate-400">{shelter.address}</div>
                <div className="text-[10px] font-semibold text-emerald-300 mt-1">
                  Occupancy: {shelter.currentOccupancy} / {shelter.totalCapacity} beds
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 4. Active SOS Requests */}
        {sosList.map((sos) => (
          <Marker
            key={sos.id}
            position={[sos.latitude, sos.longitude]}
            icon={createSOSIcon()}
          >
            <Popup className="custom-popup">
              <div className="p-1.5 text-slate-100 font-sans space-y-1">
                <div className="font-black text-xs text-red-400 flex items-center gap-1">
                  <span>🚨 DISTRESS SOS #{sos.id.slice(-4)}</span>
                </div>
                <div className="text-[11px] font-semibold text-white">{sos.description}</div>
                <div className="text-[10px] text-slate-400">
                  People: {sos.numberOfPeople} | Medical: <span className="font-bold text-red-400">{sos.medicalEmergency}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Phone: <a href={`tel:${sos.contactNumber}`} className="text-cyan-300 font-mono">{sos.contactNumber}</a>
                </div>
                <div className="text-[10px] font-bold text-amber-400">
                  Status: {sos.status}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 5. Citizen Roster */}
        {users.map((user) => (
          <Marker
            key={user.id}
            position={[user.latitude, user.longitude]}
            icon={createUserIcon(user.status)}
          >
            <Popup className="custom-popup">
              <div className="p-1 text-slate-100 font-sans">
                <div className="font-bold text-xs text-white">{user.name}</div>
                <div className="text-[10px] font-mono text-slate-400">{user.phone}</div>
                <div className="text-[10px] font-semibold mt-0.5 text-slate-400">
                  Safety:{' '}
                  <span
                    className={
                      user.status === 'SAFE'
                        ? 'text-emerald-400'
                        : user.status === 'UNSAFE'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }
                  >
                    {user.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </motion.div>
  );
}
