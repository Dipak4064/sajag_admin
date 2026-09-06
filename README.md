# 🏢 SAJAG (सजग) Municipal Command Center
### Disaster Operations, Tactical GIS Monitoring & Rescue Dispatch Console

`sajag_admin` is the administrative command center designed for Kathmandu Metropolitan City disaster coordinators, Nepal Police, Armed Police Force (APF), Nepal Army, and emergency response teams. It provides tactical situational awareness, IoT telemetry matrix, alert state management, and 1-click rescue unit dispatch.

---

## 📁 1. Directory Structure

```text
sajag_admin/
├── package.json                      # Next.js 14, Leaflet, Recharts, Lucide, Socket.IO
├── tsconfig.json                     # Standalone TypeScript compiler configuration
├── tailwind.config.ts                # Tactical Operations dark UI theme
├── next.config.mjs                   # Remote image optimization
├── .env.local                        # Backend API & Socket.IO URL endpoints
│
├── types/
│   └── index.ts                      # Standalone SAJAG domain models
│
├── lib/
│   ├── api.ts                        # Axios HTTP client with Bearer auth
│   ├── socket.ts                     # Socket.IO client singleton
│   └── utils.ts                      # Tailwind styling helpers
│
├── stores/
│   ├── auth.store.ts                 # Authority authentication session store
│   └── map.store.ts                  # Tactical GIS layer filter store
│
├── components/
│   ├── map/
│   │   └── live-map.tsx              # Full Leaflet GIS Tactical Map (Custom SVG Icons)
│   └── simulation/
│       └── simulation-modal.tsx      # 1-Click Disaster & Outage Injection Modal
│
└── app/
    ├── layout.tsx                    # Operations Header (Clock, Socket status, Simulator trigger)
    ├── globals.css                   # Tactical dark theme & pulsing marker animations
    ├── page.tsx                      # 🎛️ COMMAND CENTER (Tactical Map, KPI Tiles, SOS Stream)
    │
    ├── devices/
    │   └── page.tsx                  # 📡 IoT Sensor Telemetry Matrix & WiFi/LoRa Dynamic Toggle
    │
    ├── alerts/
    │   └── page.tsx                  # 🚨 Multi-Hazard Alert State Machine & Twilio IVR Logs
    │
    ├── sos/
    │   └── page.tsx                  # 🆘 Real-Time SOS Triage & Rescue Dispatch (Army/APF)
    │
    ├── reports/
    │   └── page.tsx                  # 📸 Citizen Incident Reports Verification Console
    │
    ├── users/
    │   └── page.tsx                  # 👥 Resident Safety Roster & Whisper Voice Transcripts
    │
    └── login/
        └── page.tsx                  # Disaster Officer Authentication
```

---

## 🛡️ 2. Operator Operational Workflows

### Workflow A: Tactical GIS Situational Awareness (`/`)
```text
Operator Dashboard (/) ──► 4 KPI Stat Tiles: Active Hazards, Pending SOS, IoT Stations, Citizen Safety Tally
                              │
                              ├─► Tactical Leaflet Map:
                              │   • 8 Kathmandu Stations (Balkhu, Sundarijal, Kirtipur, Thamel, Chobhar, Nagdhunga)
                              │   • Red Geofence Circles (5km Danger Radius around Hazard)
                              │   • Flashing SOS Distress Pins
                              │   • Safe Shelter Havens (Available bed counters)
                              │
                              └─► Live Feeds Split-Screen:
                                  • Priority SOS Queue (1-click quick review)
                                  • Live Sensor Telemetry Stream
```

### Workflow B: 1-Click Disaster & Hardware Outage Simulator
```text
Operator Clicks "SIMULATE DISASTER" in Top Header
  │
  ├─► [Bagmati Flood]      ──> Water > 85cm, Rain > 60mm/h injected into Virtual ESP32
  ├─► [Earthquake 6.8M]    ──> Acceleration > 1.8g tremors injected
  ├─► [Nagdhunga Landslide]──> Soil moisture > 90% saturation injected
  │
  ├─► [WiFi Outage Sim]    ──> Station cuts WiFi; dynamically fails over to LoRa Radio
  │
  └─► [Reset All Normal]   ──> Returns Kathmandu stations to safe baseline
```

### Workflow C: Live SOS Triage & Tactical Rescue Dispatch (`/sos`)
```text
Incoming SOS Signal (via Socket.IO 'sos:new')
  │
  ├─► Triage by Medical Urgency: CRITICAL ➔ SEVERE ➔ MINOR ➔ NONE
  ├─► Inspect trapped count, contact phone, and exact GPS coordinates
  │
  └─► 1-Click Action Dispatch:
      • "Dispatch APF 🚨" ➔ Assigns Armed Police Force Disaster Quick Reaction Unit
      • "Army Unit 🪖"    ➔ Assigns Nepal Army Disaster Management Battalion
      • "Mark Resolved ✓" ➔ Closes ticket once citizens are safely evacuated
```

### Workflow D: Outbound Twilio IVR & Whisper Voice Intelligence (`/alerts` & `/users`)
```text
Disaster Risk Breached ──► State Machine: DETECTED ➔ ANALYZING ➔ CONFIRMED ➔ NOTIFYING
                              │
                              ├─► Automated Twilio Outbound Voice Calls dialed to residents in 5km ring
                              │   • Resident presses '1' (DTMF) ➔ Logged as SAFE
                              │   • Resident presses '2' (DTMF) ➔ Logged as UNSAFE / Distress
                              │
                              └─► Resident speaks voice distress message:
                                  • Recorded audio passed to OpenAI Whisper AI
                                  • Voice transcribed to text in Nepali / English
                                  • Urgency NLP classified and surfaced on Residents Roster
```

---

## 🔌 3. API & Real-time Integration

The Command Center communicates with `sajag_backend` via:

### REST Endpoints:
- `GET /api/devices`: Fetches all 8 stations with latest readings.
- `POST /api/sim/scenario`: Injects flood, quake, or landslide curves.
- `POST /api/sim/network-mode`: Toggles device transport between `MQTT` and `LORA_SIM`.
- `GET /api/alerts`: Lists all disaster events and Twilio call status logs.
- `GET /api/sos/active`: Active distress requests requiring triage.
- `POST /api/sos/:id/assign`: Assigns a rescue unit to an SOS incident.
- `PATCH /api/reports/:id/verify`: Approves or rejects citizen field observations.

### WebSocket Events (`socket.io`):
- `reading:new`: Streams real-time IoT sensor telemetry updates.
- `device:status`: Live indicator of WiFi vs LoRa transport status.
- `alert:new` / `alert:update`: Instant hazard notifications.
- `sos:new` / `sos:update`: Live distress triage additions and status changes.
- `response:new`: Immediate update when a citizen marks themselves Safe or Unsafe.

---

## 🛠️ 4. Running the Command Center Standalone

```bash
cd /home/dipak/hacathon/sajag_admin

# Install dependencies (already executed)
npm install

# Start development server on port 3001
npm run dev
```

Navigate to [**http://localhost:3001**](http://localhost:3001) in your browser.
