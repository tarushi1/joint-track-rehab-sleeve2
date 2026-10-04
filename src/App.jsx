import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity, Bluetooth, BluetoothConnected, Bell, BellRing, ChevronDown, ChevronUp,
  Clock, Download, Heart, Thermometer, Zap, RotateCcw, Play, Square,
  Plus, User, Calendar, Target, Dumbbell, TrendingUp, Wifi, WifiOff,
  AlertTriangle, CheckCircle, XCircle, X, Info, Code, Copy, Check,
  ExternalLink, Radio, Terminal, Cpu, Unplug, PlugZap
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// ─── Constants ───────────────────────────────────────────────────────────────
const SURGERY_DATE = new Date('2025-02-15');
const TARGET_ANGLE = 90;
const TOTAL_SETS = 3;
const TOTAL_REPS = 15;
const HOLD_DURATION = 5;
const RECOVERY_WEEKS = 12;
const ALERT_COOLDOWN = 5000;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 3000;
const MAX_SERIAL_LOG = 50;

// ─── Blynk Cloud Integration ─────────────────────────────────────────────────
// The Vite dev server proxies /blynk/* → https://blynk.cloud/* (see vite.config.js)
const BLYNK_TOKEN = 'n7e7vrlgPKXzHGIAcPZnriPAZmcjVKU1';
const BLYNK_API = `/blynk/external/api/get?token=${BLYNK_TOKEN}`;

const SESSION_HISTORY = [
  { session: 1, angle: 45 }, { session: 2, angle: 50 }, { session: 3, angle: 55 },
  { session: 4, angle: 62 }, { session: 5, angle: 68 }, { session: 6, angle: 72 },
  { session: 7, angle: 76 }, { session: 8, angle: 80 }, { session: 9, angle: 85 },
  { session: 10, angle: 88 },
];

function daysSince(date) {
  return Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
}

function recoveryWeek() {
  const weeks = Math.ceil(daysSince(SURGERY_DATE) / 7);
  return Math.min(weeks, RECOVERY_WEEKS);
}

// ─── Arduino Code Constant ──────────────────────────────────────────────────
const ARDUINO_CODE = `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// Pins
int flexPin = 34;
int buzzer = 14;
int led = 27;

// Temperature Sensor
#define ONE_WIRE_BUS 4
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// Variables
int angle;
float temperature;
int heartRate;

void setup() {

  Serial.begin(115200);

  pinMode(buzzer, OUTPUT);
  pinMode(led, OUTPUT);

  sensors.begin();

  Wire.begin(21,22);

  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED failed");
    while(true);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);

}

void loop() {

  // Flex sensor reading
  int flexValue = analogRead(flexPin);

  // Convert to knee angle
  angle = map(flexValue, 0, 4095, 0, 120);

  // Read temperature
  sensors.requestTemperatures();
  temperature = sensors.getTempCByIndex(0);

  // Simulated heart rate
  heartRate = random(70,95);

  Serial.print("Knee Angle: ");
  Serial.println(angle);

  Serial.print("Temperature: ");
  Serial.println(temperature);

  Serial.print("Heart Rate: ");
  Serial.println(heartRate);
  Serial.println("=============");

  // Condition for correct exercise angle
  if(angle >= 85 && angle <= 95){

    digitalWrite(buzzer, LOW);
    digitalWrite(led, LOW);

  }
  else{

    digitalWrite(buzzer, HIGH);
    digitalWrite(led, HIGH);

  }

  // OLED Display
  display.clearDisplay();

  display.setCursor(0,0);
  display.print("Knee Angle: ");
  display.print(angle);
  display.println(" deg");

  display.setCursor(0,20);
  display.print("Temp: ");
  display.print(temperature);
  display.println(" C");

  display.setCursor(0,40);
  display.print("Heart: ");
  display.print(heartRate);
  display.println(" BPM");

  display.display();

  delay(1000);

}`;

const DIAGRAM_JSON = `{
  "version": 1,
  "author": "Weird Surname",
  "editor": "wokwi",
  "parts": [
    { "type": "board-esp32-devkit-c-v4", "id": "esp", "top": 76.8, "left": 91.24, "attrs": {} },
    { "type": "wokwi-mpu6050", "id": "imu1", "top": 339.82, "left": 271.12, "attrs": {} },
    { "type": "wokwi-mpu6050", "id": "imu2", "top": 339.82, "left": 395.92, "attrs": {} },
    { "type": "wokwi-potentiometer", "id": "pot1", "top": -106.9, "left": 259, "attrs": {} },
    { "type": "wokwi-potentiometer", "id": "pot2", "top": -135.7, "left": 393.4, "attrs": {} },
    {
      "type": "wokwi-ds18b20",
      "id": "temp1",
      "top": -58.73,
      "left": 522.48,
      "attrs": { "temperature": "43.4" }
    },
    {
      "type": "wokwi-led",
      "id": "led1",
      "top": -80.4,
      "left": 733.4,
      "attrs": { "color": "red" }
    },
    {
      "type": "wokwi-buzzer",
      "id": "bz1",
      "top": -103.2,
      "left": 625.8,
      "attrs": { "volume": "0.1" }
    },
    {
      "type": "wokwi-resistor",
      "id": "r1",
      "top": 311.15,
      "left": 633.6,
      "attrs": { "value": "4700" }
    },
    {
      "type": "wokwi-resistor",
      "id": "r2",
      "top": 167.15,
      "left": 633.6,
      "attrs": { "value": "220" }
    },
    {
      "type": "board-ssd1306",
      "id": "oled1",
      "top": 252.74,
      "left": -95.77,
      "attrs": { "i2cAddress": "0x3c" }
    }
  ],
  "connections": [
    [ "esp:TX", "$serialMonitor:RX", "", [] ],
    [ "esp:RX", "$serialMonitor:TX", "", [] ],
    [ "imu1:VCC", "esp:3V3", "red", [ "v0" ] ],
    [ "imu1:GND", "esp:GND.2", "black", [ "v0" ] ],
    [ "imu1:SDA", "esp:21", "green", [ "v0" ] ],
    [ "imu1:SCL", "esp:22", "green", [ "v0" ] ],
    [ "imu1:AD0", "esp:GND.2", "green", [ "v0" ] ],
    [ "imu2:VCC", "esp:3V3", "red", [ "v0" ] ],
    [ "imu2:GND", "esp:GND.2", "black", [ "v0" ] ],
    [ "imu2:SDA", "esp:21", "green", [ "v0" ] ],
    [ "imu2:SCL", "esp:22", "green", [ "v0" ] ],
    [ "imu2:AD0", "esp:3V3", "green", [ "v0" ] ],
    [ "pot1:GND", "esp:GND.2", "black", [ "v0" ] ],
    [ "pot1:SIG", "esp:34", "green", [ "v0" ] ],
    [ "pot1:VCC", "esp:3V3", "red", [ "v0" ] ],
    [ "pot2:GND", "esp:GND.2", "black", [ "v0" ] ],
    [ "pot2:VCC", "esp:3V3", "red", [ "v0" ] ],
    [ "pot2:SIG", "esp:35", "green", [ "v0" ] ],
    [ "temp1:GND", "esp:GND.3", "black", [ "v0" ] ],
    [ "temp1:VCC", "esp:3V3", "red", [ "v0" ] ],
    [ "led1:A", "esp:27", "green", [ "v0" ] ],
    [ "oled1:VCC", "esp:3V3", "red", [ "v0" ] ],
    [ "oled1:GND", "esp:GND.3", "black", [ "v0" ] ],
    [ "oled1:SDA", "esp:21", "green", [ "v0" ] ],
    [ "oled1:SCL", "esp:22", "green", [ "v0" ] ],
    [ "led1:C", "r2:2", "green", [ "v0" ] ],
    [ "r2:1", "esp:GND.3", "green", [ "v0" ] ],
    [ "temp1:DQ", "r1:1", "green", [ "v0" ] ],
    [ "r1:2", "esp:3V3", "green", [ "v0" ] ],
    [ "temp1:DQ", "esp:4", "green", [ "v0" ] ],
    [ "bz1:1", "esp:GND.1", "green", [ "v0" ] ],
    [ "bz1:2", "esp:14", "green", [ "v0" ] ]
  ],
  "dependencies": {}
}`;

// ─── Gauge Components ────────────────────────────────────────────────────────

function SemiCircleGauge({ value, min = 0, max = 150, zones, label, unit, badge }) {
  const radius = 70;
  const cx = 90;
  const cy = 85;
  const circumference = Math.PI * radius;
  const clampedVal = Math.max(min, Math.min(max, value));
  const ratio = (clampedVal - min) / (max - min);
  const dashOffset = circumference * (1 - ratio);

  const getColor = (v) => {
    for (const z of zones) {
      if (v >= z.min && v <= z.max) return z.color;
    }
    return '#94a3b8';
  };

  const needleLength = 55;
  const needleAngle = (-180 + ratio * 180) * (Math.PI / 180);
  const nx = cx + needleLength * Math.cos(needleAngle);
  const ny = cy + needleLength * Math.sin(needleAngle);

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 180 100">
        {/* Background arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round"
        />
        {/* Zone arcs */}
        {zones.map((z, i) => {
          const startRatio = (z.min - min) / (max - min);
          const endRatio = (z.max - min) / (max - min);
          const startAngle = Math.PI + startRatio * Math.PI;
          const endAngle = Math.PI + endRatio * Math.PI;
          const x1 = cx + radius * Math.cos(startAngle);
          const y1 = cy - radius * Math.sin(startAngle);
          const x2 = cx + radius * Math.cos(endAngle);
          const y2 = cy - radius * Math.sin(endAngle);
          const largeArc = (endRatio - startRatio) > 0.5 ? 1 : 0;
          return (
            <path key={i}
              d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`}
              fill="none" stroke={z.color} strokeWidth="14" strokeLinecap="butt"
              opacity="0.3"
            />
          );
        })}
        {/* Active arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none" stroke={getColor(clampedVal)} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="gauge-sweep"
        />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round"
          style={{ transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <circle cx={cx} cy={cy} r="4" fill="#f1f5f9" />
      </svg>
      <div className="text-3xl font-bold -mt-2 transition-all duration-300" style={{ color: getColor(clampedVal) }}>
        {Math.round(value)}{unit}
      </div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
      {badge && (
        <div className={`text-xs mt-1 px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
          {badge.text}
        </div>
      )}
    </div>
  );
}

function HorizontalBar({ value, max = 100, label, subLabel, getColor, getStatus }) {
  const color = getColor(value);
  const status = getStatus(value);
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-medium" style={{ color }}>{status}</span>
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-[10px] text-slate-500">{subLabel}</span>
        <span className="text-sm font-semibold" style={{ color }}>{Math.round(value)}%</span>
      </div>
    </div>
  );
}

function CircularGauge({ value, max = 100, label, unit, getColor, getStatus, size = 80 }) {
  const color = getColor(value);
  const status = getStatus(value);
  const r = (size - 12) / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = Math.min(1, value / max);
  const offset = circumference * (1 - ratio);
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#334155" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="text-lg font-bold -mt-12 transition-colors duration-300" style={{ color }}>
        {Math.round(value)}{unit}
      </div>
      <div className="text-[10px] text-slate-400 mt-5">{label}</div>
      <div className="text-[10px] font-medium mt-0.5" style={{ color }}>{status}</div>
    </div>
  );
}

// ─── Copy Button Component ───────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-slate-200 transition-all border border-slate-600/30">
      {copied ? <><Check size={11} className="text-green-400" /> Copied!</> : <><Copy size={11} /> Copy</>}
    </button>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  // ── Mode & Connection ──
  const [mode, setMode] = useState('simulation'); // 'simulation' | 'hardware' | 'wokwi'
  const [hwConnecting, setHwConnecting] = useState(false);
  const [now, setNow] = useState(new Date());

  // ── Blynk / Wokwi State ──
  const [wokwiProjectId, setWokwiProjectId] = useState('');
  const [wokwiStatus, setWokwiStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected' | 'error'
  const [serialLog, setSerialLog] = useState([]);
  const blynkPollInterval = useRef(null);
  const reconnectAttempts = useRef(0);

  // ── Sensor Values ──
  const [kneeAngle, setKneeAngle] = useState(45);
  const [force, setForce] = useState(50);
  const [heartRate, setHeartRate] = useState(72);
  const [temperature, setTemperature] = useState(36.5);
  const [emg, setEmg] = useState(55);
  const [flexSensor, setFlexSensor] = useState(25);

  // ── Session State ──
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [repsCompleted, setRepsCompleted] = useState(0);
  const [holdTimer, setHoldTimer] = useState(0);
  const [holdActive, setHoldActive] = useState(false);
  const [repQualities, setRepQualities] = useState([]);
  const [peakAngle, setPeakAngle] = useState(0);
  const [totalSessionReps, setTotalSessionReps] = useState(0);
  const [totalSessionSets, setTotalSessionSets] = useState(0);
  const [avgHR, setAvgHR] = useState(0);
  const hrSamples = useRef([]);

  // ── Alerts ──
  const [alerts, setAlerts] = useState([]);
  const alertCooldowns = useRef({});

  // ── Collapsible sections ──
  const [sectionsOpen, setSectionsOpen] = useState({
    patient: true, controls: true, sliders: true, gauges: true,
    tracker: true, alerts: true, history: true, summary: true,
    devPanel: false, serialLogPanel: false
  });

  // ── Target flash ──
  const [targetFlash, setTargetFlash] = useState(false);

  // ── Wokwi connection panel visibility ──
  const [showWokwiPanel, setShowWokwiPanel] = useState(false);

  // ─── Clock ──
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ─── Session Timer ──
  useEffect(() => {
    if (!sessionActive) return;
    const t = setInterval(() => setSessionTime(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [sessionActive]);

  // ─── Hold Timer ──
  useEffect(() => {
    if (!holdActive) return;
    if (holdTimer >= HOLD_DURATION) {
      setHoldActive(false);
      return;
    }
    const t = setInterval(() => setHoldTimer(h => h + 1), 1000);
    return () => clearInterval(t);
  }, [holdActive, holdTimer]);

  // ─── Flex sensor follows knee angle roughly (only in simulation mode) ──
  useEffect(() => {
    if (mode === 'simulation') {
      setFlexSensor(Math.min(100, Math.max(0, (kneeAngle / 150) * 100 + (Math.random() - 0.5) * 5)));
    }
  }, [kneeAngle, mode]);

  // ─── Peak angle tracking ──
  useEffect(() => {
    if (sessionActive && kneeAngle > peakAngle) setPeakAngle(kneeAngle);
  }, [kneeAngle, sessionActive, peakAngle]);

  // ─── HR average tracking ──
  useEffect(() => {
    if (sessionActive) {
      hrSamples.current.push(heartRate);
      setAvgHR(Math.round(hrSamples.current.reduce((a, b) => a + b, 0) / hrSamples.current.length));
    }
  }, [heartRate, sessionActive]);

  // ─── Target flash when angle enters target zone ──
  useEffect(() => {
    if (kneeAngle >= 76 && kneeAngle <= 95) {
      setTargetFlash(true);
      const t = setTimeout(() => setTargetFlash(false), 2000);
      return () => clearTimeout(t);
    }
  }, [kneeAngle]);

  // ─── Hardware mode simulation ──
  useEffect(() => {
    if (mode === 'hardware') {
      setHwConnecting(true);
      const t = setTimeout(() => setHwConnecting(false), 3000);
      return () => clearTimeout(t);
    }
  }, [mode]);

  // ─── Alert Generation ──
  const addAlert = useCallback((type, icon, message, severity) => {
    const key = type;
    const cooldownTime = alertCooldowns.current[key];
    if (cooldownTime && Date.now() - cooldownTime < ALERT_COOLDOWN) return;
    alertCooldowns.current[key] = Date.now();
    setAlerts(prev => [{
      id: Date.now() + Math.random(),
      type, icon, message, severity,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }, ...prev].slice(0, 20));
  }, []);

  useEffect(() => {
    if (kneeAngle > 95) addAlert('overbend', '🔴', `Over-bending detected — ${Math.round(kneeAngle)}°`, 'danger');
    if (kneeAngle >= 76 && kneeAngle <= 95) addAlert('target', '🟢', `Target angle reached — ${Math.round(kneeAngle)}°`, 'success');
    if (temperature > 37.5 && temperature <= 39) addAlert('temp_mild', '🟠', `High temperature — ${temperature.toFixed(1)}°C`, 'warning');
    if (temperature > 39) addAlert('temp_high', '🔴', `Inflammation alert — ${temperature.toFixed(1)}°C`, 'danger');
    if (heartRate > 130) addAlert('hr_high', '🔴', `Heart rate elevated — ${Math.round(heartRate)} BPM`, 'danger');
    if (emg < 40) addAlert('emg_low', '🟡', `Weak muscle engagement — ${Math.round(emg)}%`, 'warning');
    if (emg > 80) addAlert('emg_high', '🟡', `Overexertion detected — ${Math.round(emg)}%`, 'warning');
  }, [kneeAngle, temperature, heartRate, emg, addAlert]);

  const dismissAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Blynk HTTP API Polling (replaces WebSocket) ──────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  const addSerialLine = useCallback((line) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 1 });
    setSerialLog(prev => [`[${timestamp}] ${line}`, ...prev].slice(0, MAX_SERIAL_LOG));
  }, []);

  // Fetch all 5 sensor values from Blynk Cloud via getAll endpoint
  const fetchBlynkData = useCallback(async () => {
    try {
      // Fetch each virtual pin individually since getAll may not be available
      const [r0, r1, r2, r3, r4] = await Promise.all([
        fetch(`${BLYNK_API}&v0`),  // Knee Angle
        fetch(`${BLYNK_API}&v1`),  // Force
        fetch(`${BLYNK_API}&v2`),  // Heart Rate
        fetch(`${BLYNK_API}&v3`),  // Temperature
        fetch(`${BLYNK_API}&v4`),  // EMG
      ]);

      // Check if any request failed (device offline)
      if (!r0.ok || !r1.ok || !r2.ok || !r3.ok || !r4.ok) {
        throw new Error('Blynk API returned error');
      }

      const [v0, v1, v2, v3, v4] = await Promise.all([
        r0.json(), r1.json(), r2.json(), r3.json(), r4.json()
      ]);

      // Map Blynk virtual pins to dashboard state
      const kneeVal = parseFloat(v0) || 0;
      const forceVal = parseFloat(v1) || 0;
      const hrVal = parseFloat(v2) || 72;
      const tempVal = parseFloat(v3) || 36.5;
      const emgVal = parseFloat(v4) || 0;

      setKneeAngle(Math.max(0, Math.min(150, kneeVal)));
      setForce(Math.max(0, Math.min(100, forceVal)));
      setHeartRate(Math.max(40, Math.min(200, hrVal)));
      setTemperature(Math.max(30, Math.min(45, tempVal)));
      setEmg(Math.max(0, Math.min(100, emgVal)));

      // Also update flex sensor to track knee angle
      setFlexSensor(Math.min(100, Math.max(0, (kneeVal / 150) * 100)));

      setWokwiStatus('connected');

      addSerialLine(`V0=${kneeVal.toFixed(1)}° V1=${forceVal}% V2=${hrVal}bpm V3=${tempVal.toFixed(1)}°C V4=${emgVal}%`);
    } catch (err) {
      setWokwiStatus('error');
      addSerialLine(`--- Blynk fetch error: ${err.message} ---`);
    }
  }, [addSerialLine]);

  // Start polling Blynk API every 1 second
  const startBlynkPolling = useCallback(() => {
    // Clean up any existing polling
    if (blynkPollInterval.current) {
      clearInterval(blynkPollInterval.current);
    }

    setWokwiStatus('connecting');
    setMode('wokwi');
    addSerialLine('--- Connecting to Blynk Cloud... ---');

    // Fetch immediately, then every 1 second
    fetchBlynkData();
    blynkPollInterval.current = setInterval(fetchBlynkData, 1000);
  }, [addSerialLine, fetchBlynkData]);

  // Stop polling
  const stopBlynkPolling = useCallback(() => {
    if (blynkPollInterval.current) {
      clearInterval(blynkPollInterval.current);
      blynkPollInterval.current = null;
    }

    setWokwiStatus('disconnected');
    setMode('simulation');
    addSerialLine('--- Disconnected from Blynk ---');
  }, [addSerialLine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blynkPollInterval.current) clearInterval(blynkPollInterval.current);
    };
  }, []);

  // ─── Session Controls ──
  const startSession = () => {
    setSessionActive(true);
    setSessionTime(0);
    setCurrentSet(1);
    setRepsCompleted(0);
    setRepQualities([]);
    setPeakAngle(0);
    setTotalSessionReps(0);
    setTotalSessionSets(0);
    hrSamples.current = [];
    setAvgHR(0);
  };

  const stopSession = () => {
    setSessionActive(false);
    setTotalSessionReps(repsCompleted + (currentSet - 1) * TOTAL_REPS);
    setTotalSessionSets(currentSet);
  };

  const resetSession = () => {
    setSessionActive(false);
    setSessionTime(0);
    setCurrentSet(1);
    setRepsCompleted(0);
    setRepQualities([]);
    setHoldTimer(0);
    setHoldActive(false);
    setPeakAngle(0);
    setTotalSessionReps(0);
    setTotalSessionSets(0);
    hrSamples.current = [];
    setAvgHR(0);
  };

  const logRep = () => {
    if (!sessionActive) return;
    let quality = 'red';
    if (kneeAngle >= 76 && kneeAngle <= 95) quality = 'green';
    else if (kneeAngle >= 31 && kneeAngle <= 75) quality = 'yellow';

    setRepQualities(prev => [...prev, quality].slice(-15));
    setHoldTimer(0);
    setHoldActive(true);

    const newReps = repsCompleted + 1;
    if (newReps >= TOTAL_REPS) {
      if (currentSet < TOTAL_SETS) {
        setCurrentSet(s => s + 1);
        setRepsCompleted(0);
      } else {
        setRepsCompleted(TOTAL_REPS);
        stopSession();
      }
    } else {
      setRepsCompleted(newReps);
    }
  };

  const toggleSection = (key) => {
    setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ─── Angle badge logic ──
  const getAngleBadge = () => {
    if (kneeAngle > 95) return { text: '⚠ Over-bent', className: 'bg-red-500/20 text-red-400' };
    if (kneeAngle >= 76) return { text: '✓ Target Reached', className: 'bg-green-500/20 text-green-400' };
    if (kneeAngle >= 31) return { text: 'Partial Bend', className: 'bg-yellow-500/20 text-yellow-400' };
    return { text: 'Resting', className: 'bg-blue-500/20 text-blue-400' };
  };

  const angleZones = [
    { min: 0, max: 30, color: '#3b82f6' },
    { min: 31, max: 75, color: '#eab308' },
    { min: 76, max: 95, color: '#22c55e' },
    { min: 96, max: 150, color: '#ef4444' },
  ];

  // ─── Wokwi/Blynk status helpers ──
  const getWokwiStatusDisplay = () => {
    switch (wokwiStatus) {
      case 'connected': return { dot: 'bg-green-400 pulse-dot shadow-lg shadow-green-400/50', text: 'LIVE', textColor: 'text-green-400' };
      case 'connecting': return { dot: 'bg-yellow-400 pulse-dot shadow-lg shadow-yellow-400/50', text: 'CONNECTING', textColor: 'text-yellow-400' };
      case 'error': return { dot: 'bg-red-400 shadow-lg shadow-red-400/50', text: 'DISCONNECTED', textColor: 'text-red-400' };
      default: return { dot: 'bg-slate-500', text: 'Not Connected', textColor: 'text-slate-400' };
    }
  };

  // ─── Section Header ──
  const SectionHeader = ({ title, icon: Icon, sectionKey, accent = false, badge: badgeContent }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between px-4 py-2.5 rounded-t-xl hover:bg-slate-700/30 transition-colors"
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className={accent ? 'text-teal-400' : 'text-slate-400'} />}
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        {badgeContent && badgeContent}
      </div>
      {sectionsOpen[sectionKey] ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
    </button>
  );

  const wokwiStatusInfo = getWokwiStatusDisplay();

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-700/50 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-teal-400">Joint</span><span className="text-white">Track</span>
            </h1>
            <p className="text-[10px] text-slate-500 -mt-0.5">Knee Rehab Monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode toggles — 3 modes */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700/50">
            <button
              onClick={() => { if (mode !== 'wokwi') setMode('simulation'); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
                mode === 'simulation'
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Simulation
            </button>
            <button
              onClick={() => { if (mode !== 'wokwi') setMode('hardware'); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
                mode === 'hardware'
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Hardware
            </button>
            <button
              onClick={() => setShowWokwiPanel(p => !p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
                mode === 'wokwi'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Cpu size={12} />
              Wokwi
            </button>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            {mode === 'wokwi' ? (
              <>
                <div className={`w-2.5 h-2.5 rounded-full ${wokwiStatusInfo.dot}`} />
                <span className={`text-xs font-medium ${wokwiStatusInfo.textColor}`}>{wokwiStatusInfo.text}</span>
                <Radio size={14} className={wokwiStatusInfo.textColor} />
              </>
            ) : mode === 'hardware' ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 pulse-dot shadow-lg shadow-green-400/50" />
                <span className="text-xs text-green-400 font-medium">Connected</span>
                <BluetoothConnected size={14} className="text-green-400" />
              </>
            ) : (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span className="text-xs text-slate-400">Simulating</span>
                <Bluetooth size={14} className="text-slate-500" />
              </>
            )}
          </div>

          {/* Clock */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock size={14} />
            <span className="font-mono">
              {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              {' • '}
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </nav>

      {/* ═══════════ BLYNK CONNECTION PANEL ═══════════ */}
      {showWokwiPanel && (
        <div className="bg-[#162032] border-b border-slate-700/50 px-6 py-3">
          <div className="max-w-[1920px] mx-auto flex items-center gap-4 flex-wrap">
            {/* Blynk status label */}
            <div className="flex items-center gap-2 min-w-[200px]">
              <label className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1.5">
                <Cpu size={13} className="text-teal-400" />
                Blynk Cloud
              </label>
              <span className="text-[10px] text-slate-600 font-mono">Token: {BLYNK_TOKEN.slice(0, 8)}…</span>
            </div>

            {/* Connect / Disconnect buttons */}
            <div className="flex items-center gap-2">
              {wokwiStatus === 'connected' || wokwiStatus === 'connecting' ? (
                <button
                  onClick={stopBlynkPolling}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all"
                >
                  <Unplug size={13} /> Disconnect
                </button>
              ) : (
                <button
                  onClick={startBlynkPolling}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                >
                  <PlugZap size={13} />
                  Connect to Blynk
                </button>
              )}
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <div className={`w-2 h-2 rounded-full ${wokwiStatusInfo.dot}`} />
              <span className={`text-[11px] font-medium ${wokwiStatusInfo.textColor}`}>{wokwiStatusInfo.text}</span>
              {wokwiStatus === 'error' && (
                <span className="text-[10px] text-red-400/70">— device may be offline</span>
              )}
            </div>

            {/* Open Blynk dashboard link */}
            <a
              href="https://blynk.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-teal-400/70 hover:text-teal-400 transition-colors"
            >
              Open Blynk Dashboard <ExternalLink size={11} />
            </a>

            {/* Note */}
            <span className="text-[10px] text-slate-600 italic ml-auto">
              Wokwi → Blynk Cloud → Dashboard (HTTP polling every 1s)
            </span>
          </div>
        </div>
      )}

      {/* ═══════════ BLYNK LIVE BANNER ═══════════ */}
      {mode === 'wokwi' && wokwiStatus === 'connected' && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2">
          <div className="max-w-[1920px] mx-auto flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-xs text-emerald-400 font-medium">🟢 LIVE — Receiving data from Blynk Cloud</span>
            <span className="text-[10px] text-emerald-400/50 ml-2">Wokwi → Blynk → Dashboard</span>
          </div>
        </div>
      )}

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div className="flex-1 p-4 grid grid-cols-12 gap-4 max-w-[1920px] mx-auto w-full">

        {/* ─── LEFT COLUMN ─── */}
        <div className="col-span-3 space-y-4">
          {/* Patient Profile */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
            <SectionHeader title="Patient Profile" icon={User} sectionKey="patient" accent />
            {sectionsOpen.patient && (
              <div className="px-4 pb-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-teal-500/20">
                    RK
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Rajesh Kumar</h4>
                    <p className="text-xs text-slate-400">Age: 34 • Male</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-700/40">
                    <span className="text-slate-400">Injury</span>
                    <span className="text-slate-200 font-medium">ACL Reconstruction (Left)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/40">
                    <span className="text-slate-400">Surgery Date</span>
                    <span className="text-slate-200">15 Feb 2025</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/40">
                    <span className="text-slate-400">Days Since Surgery</span>
                    <span className="text-teal-400 font-semibold">{daysSince(SURGERY_DATE)} days</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/40">
                    <span className="text-slate-400">Physiotherapist</span>
                    <span className="text-slate-200">Dr. Meera Nair</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/40">
                    <span className="text-slate-400">Recovery Week</span>
                    <span className="text-emerald-400 font-semibold">Week {recoveryWeek()} of {RECOVERY_WEEKS}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-700/40">
                    <span className="text-slate-400">Target Angle</span>
                    <span className="bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full text-[11px] font-semibold">{TARGET_ANGLE}°</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Prescribed</span>
                    <span className="text-slate-200">{TOTAL_SETS} Sets × {TOTAL_REPS} Reps, Hold {HOLD_DURATION}s</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Session Controls */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
            <SectionHeader title="Session Controls" icon={Dumbbell} sectionKey="controls" accent />
            {sectionsOpen.controls && (
              <div className="px-4 pb-4 space-y-3">
                {/* Start/Stop */}
                <button
                  onClick={sessionActive ? stopSession : startSession}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                    sessionActive
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  }`}
                >
                  {sessionActive ? <><Square size={16} /> Stop Session</> : <><Play size={16} /> Start Session</>}
                </button>

                {/* Timer */}
                <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/40">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Session Timer</div>
                  <div className="text-2xl font-mono font-bold text-white">{formatTime(sessionTime)}</div>
                </div>

                {/* Set / Rep counters */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 rounded-lg p-2.5 text-center border border-slate-700/40">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Current Set</div>
                    <div className="text-lg font-bold text-teal-400">{currentSet}/{TOTAL_SETS}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2.5 text-center border border-slate-700/40">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Reps</div>
                    <div className="text-lg font-bold text-teal-400">{repsCompleted}/{TOTAL_REPS}</div>
                  </div>
                </div>

                {/* +Rep button (visible in simulation and wokwi modes) */}
                <button
                  onClick={logRep}
                  disabled={!sessionActive}
                  className={`w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                    sessionActive
                      ? 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30'
                      : 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-700/30'
                  }`}
                >
                  <Plus size={16} /> + Rep
                </button>

                {/* Hold Timer */}
                <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/40">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Hold Timer</div>
                  <div className={`text-xl font-mono font-bold ${holdActive ? 'text-amber-400' : 'text-slate-500'}`}>
                    {holdTimer}/{HOLD_DURATION}s
                  </div>
                  {holdActive && (
                    <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{ width: `${(holdTimer / HOLD_DURATION) * 100}%` }} />
                    </div>
                  )}
                </div>

                {/* Reset */}
                <button
                  onClick={resetSession}
                  className="w-full py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all flex items-center justify-center gap-2 border border-slate-700/30"
                >
                  <RotateCcw size={14} /> Reset Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── CENTER COLUMN ─── */}
        <div className="col-span-6 space-y-4">
          {/* Mode Input Panel */}
          {mode === 'simulation' ? (
            <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
              <SectionHeader title="Simulation Controls" icon={Zap} sectionKey="sliders" accent />
              {sectionsOpen.sliders && (
                <div className="px-4 pb-4 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Knee Angle', value: kneeAngle, set: setKneeAngle, min: 0, max: 150, unit: '°', color: '#14b8a6' },
                    { label: 'Force / Pressure', value: force, set: setForce, min: 0, max: 100, unit: '%', color: '#14b8a6' },
                    { label: 'Heart Rate', value: heartRate, set: setHeartRate, min: 40, max: 200, unit: ' BPM', color: '#ef4444' },
                    { label: 'Temperature', value: temperature, set: setTemperature, min: 30, max: 45, unit: '°C', step: 0.1, color: '#f59e0b' },
                    { label: 'EMG Signal', value: emg, set: setEmg, min: 0, max: 100, unit: '%', color: '#8b5cf6' },
                  ].map((s, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-slate-400">{s.label}</label>
                        <span className="text-xs font-mono font-semibold" style={{ color: s.color }}>
                          {typeof s.value === 'number' && s.step ? s.value.toFixed(1) : Math.round(s.value)}{s.unit}
                        </span>
                      </div>
                      <input
                        type="range" min={s.min} max={s.max} step={s.step || 1}
                        value={s.value}
                        onChange={(e) => s.set(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-slate-600">
                        <span>{s.min}</span><span>{s.max}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : mode === 'wokwi' ? (
            /* Blynk/Wokwi mode banner */
            <div className="bg-[#1e293b] rounded-xl border border-emerald-500/20 overflow-hidden shadow-xl p-5">
              <div className="flex items-center justify-center gap-3">
                <div className="relative">
                  <Cpu size={26} className="text-emerald-400" />
                  {wokwiStatus === 'connected' && (
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 pulse-dot" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-400">
                    {wokwiStatus === 'connected' ? '🟢 LIVE — Receiving data via Blynk Cloud' :
                     wokwiStatus === 'connecting' ? '🟡 CONNECTING to Blynk Cloud...' :
                     wokwiStatus === 'error' ? '🔴 DISCONNECTED — device may be offline' :
                     'Wokwi Mode — click Connect above'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {wokwiStatus === 'connected' ? 'Wokwi ESP32 → Blynk Cloud (V0–V4) → Dashboard HTTP poll' :
                     wokwiStatus === 'connecting' ? 'Polling Blynk HTTP API...' :
                     'Ensure Wokwi simulation is running and connected to Blynk'}
                  </p>
                </div>
                {wokwiStatus === 'connected' && (
                  <div className="flex gap-1 ml-4">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-emerald-400" style={{ animation: `pulse-dot 1.5s ease-in-out ${i * 0.3}s infinite` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Hardware mode banner */
            <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden shadow-xl p-6">
              <div className="flex items-center justify-center gap-3 ble-scan">
                <BluetoothConnected size={24} className="text-teal-400" />
                <div>
                  <p className="text-sm font-medium text-teal-400">Reading from hardware via BLE...</p>
                  <p className="text-xs text-slate-500">IMU + Force + EMG sensors streaming data</p>
                </div>
                <div className="flex gap-1 ml-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-teal-400" style={{ animation: `pulse-dot 1.5s ease-in-out ${i * 0.3}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Live Sensor Gauges */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
            <SectionHeader title="Live Sensor Gauges" icon={Activity} sectionKey="gauges" accent
              badge={mode === 'wokwi' && wokwiStatus === 'connected' ? (
                <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">LIVE</span>
              ) : null}
            />
            {sectionsOpen.gauges && (
              <div className="px-4 pb-4 grid grid-cols-3 gap-3">
                {/* Knee Angle Gauge */}
                <div className={`bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 flex flex-col items-center transition-all duration-500 ${targetFlash ? 'target-flash' : ''}`}>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Knee Angle</div>
                  <SemiCircleGauge
                    value={kneeAngle} min={0} max={150}
                    zones={angleZones}
                    label="Range of Motion"
                    unit="°"
                    badge={getAngleBadge()}
                  />
                </div>

                {/* Flex Sensor */}
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 flex flex-col justify-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-semibold">Flex Sensor</div>
                  <HorizontalBar
                    value={flexSensor} max={100}
                    label="Validation Sensor"
                    subLabel="Bend %"
                    getColor={(v) => {
                      const diff = Math.abs(v - (kneeAngle / 150) * 100);
                      return diff < 15 ? '#22c55e' : '#eab308';
                    }}
                    getStatus={(v) => {
                      const diff = Math.abs(v - (kneeAngle / 150) * 100);
                      return diff < 15 ? 'Consistent' : 'Deviation';
                    }}
                  />
                </div>

                {/* Force / Pressure */}
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 flex flex-col items-center justify-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Force / Pressure</div>
                  <CircularGauge
                    value={force} max={100}
                    label="Weight Bearing"
                    unit="%"
                    getColor={(v) => v > 80 ? '#ef4444' : v < 40 ? '#eab308' : '#22c55e'}
                    getStatus={(v) => v > 80 ? 'Overloaded' : v < 40 ? 'Underloaded' : 'Correct'}
                  />
                </div>

                {/* Heart Rate */}
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 flex flex-col items-center justify-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Heart Rate</div>
                  <Heart size={32} className={`heartbeat mb-1 ${heartRate > 130 ? 'text-red-400' : 'text-emerald-400'}`} fill={heartRate > 130 ? '#f87171' : '#34d399'} />
                  <div className={`text-2xl font-bold transition-colors duration-300 ${heartRate > 130 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {Math.round(heartRate)}
                  </div>
                  <div className="text-[10px] text-slate-400">BPM</div>
                  <div className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-medium ${
                    heartRate > 130 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {heartRate > 130 ? 'High' : 'Safe'}
                  </div>
                </div>

                {/* Temperature */}
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 flex flex-col items-center justify-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Temperature</div>
                  <div className="relative flex items-end gap-2 mb-1">
                    <Thermometer size={28} className={`${
                      temperature > 39 ? 'text-red-400' : temperature > 37.5 ? 'text-amber-400' : 'text-emerald-400'
                    }`} />
                    <div className="w-4 bg-slate-700 rounded-full h-16 overflow-hidden relative">
                      <div
                        className={`absolute bottom-0 w-full rounded-full transition-all duration-500 ${
                          temperature > 39 ? 'bg-red-400' : temperature > 37.5 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ height: `${((temperature - 30) / 15) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    temperature > 39 ? 'text-red-400' : temperature > 37.5 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {temperature.toFixed(1)}°C
                  </div>
                  <div className={`text-[10px] mt-1 px-2 py-0.5 rounded-full font-medium ${
                    temperature > 39 ? 'bg-red-500/20 text-red-400' : temperature > 37.5 ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                    {temperature > 39 ? 'Inflammation' : temperature > 37.5 ? 'Mild Inflammation' : 'Normal'}
                  </div>
                </div>

                {/* EMG Muscle Activation */}
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 flex flex-col justify-center">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-semibold">EMG Activation</div>
                  <HorizontalBar
                    value={emg} max={100}
                    label="Quadriceps Engagement"
                    subLabel="Muscle activation"
                    getColor={(v) => v < 40 ? '#ef4444' : v > 80 ? '#ef4444' : '#22c55e'}
                    getStatus={(v) => v < 40 ? 'Weak' : v > 80 ? 'Overexertion' : 'Good'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Exercise Tracker */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
            <SectionHeader title="Exercise Tracker" icon={Target} sectionKey="tracker" accent />
            {sectionsOpen.tracker && (
              <div className="px-4 pb-4 space-y-3">
                {/* Stat boxes */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Current Angle', value: `${Math.round(kneeAngle)}°`, color: 'text-teal-400' },
                    { label: 'Reps Done', value: `${repsCompleted}/${TOTAL_REPS}`, color: 'text-emerald-400' },
                    { label: 'Sets Done', value: `${currentSet}/${TOTAL_SETS}`, color: 'text-blue-400' },
                    { label: 'Hold Duration', value: `${holdTimer}/${HOLD_DURATION}s`, color: 'text-amber-400' },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-800/40 rounded-lg p-3 text-center border border-slate-700/30">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{s.label}</div>
                      <div className={`text-xl font-bold ${s.color} transition-all duration-300`}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Rep Quality */}
                <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Rep Quality (Last 15)</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {repQualities.length === 0 ? (
                      <span className="text-[10px] text-slate-600 italic">No reps logged yet</span>
                    ) : (
                      repQualities.map((q, i) => (
                        <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300 ${
                          q === 'green' ? 'bg-green-500 text-green-950' : q === 'yellow' ? 'bg-yellow-500 text-yellow-950' : 'bg-red-500 text-red-950'
                        }`}>
                          {i + 1}
                        </div>
                      ))
                    )}
                  </div>
                  {repQualities.length > 0 && (
                    <div className="flex gap-3 mt-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Target</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Partial</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Over-bent</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="col-span-3 space-y-4">
          {/* Alerts */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
            <SectionHeader title="Live Alerts" icon={BellRing} sectionKey="alerts" accent />
            {sectionsOpen.alerts && (
              <div className="px-4 pb-4">
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {alerts.length === 0 ? (
                    <div className="text-center py-6 text-slate-600 text-xs">
                      <Bell size={20} className="mx-auto mb-2 text-slate-700" />
                      No alerts yet — adjust sensors to trigger
                    </div>
                  ) : (
                    alerts.slice(0, 10).map((a) => (
                      <div key={a.id} className={`flex items-start gap-2 p-2.5 rounded-lg border transition-all duration-300 ${
                        a.severity === 'danger' ? 'bg-red-500/10 border-red-500/20' :
                        a.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
                        'bg-green-500/10 border-green-500/20'
                      }`}>
                        <span className="text-sm flex-shrink-0">{a.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-200 leading-tight">{a.message}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{a.time}</p>
                        </div>
                        <button onClick={() => dismissAlert(a.id)} className="flex-shrink-0 text-slate-600 hover:text-slate-300 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Session History Graph */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
            <SectionHeader title="Recovery Progress" icon={TrendingUp} sectionKey="history" accent />
            {sectionsOpen.history && (
              <div className="px-4 pb-4">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[10px] text-slate-500">Max Knee Angle per Session</span>
                  <TrendingUp size={12} className="text-teal-400" />
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={SESSION_HISTORY} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="session" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#334155' }} tickLine={false} label={{ value: 'Session', position: 'bottom', fill: '#475569', fontSize: 10, offset: -2 }} />
                    <YAxis domain={[0, 150]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#14b8a6' }}
                    />
                    <ReferenceLine y={TARGET_ANGLE} stroke="#14b8a6" strokeDasharray="6 3" label={{ value: 'Target 90°', position: 'right', fill: '#14b8a6', fontSize: 10 }} />
                    <Line type="monotone" dataKey="angle" stroke="#14b8a6" strokeWidth={2.5} dot={{ fill: '#14b8a6', r: 4, strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Today's Session Summary */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
            <SectionHeader title="Today's Summary" icon={Calendar} sectionKey="summary" accent />
            {sectionsOpen.summary && (
              <div className="px-4 pb-4 space-y-2">
                {[
                  { label: 'Total Reps', value: totalSessionReps || (sessionActive ? repsCompleted + (currentSet - 1) * TOTAL_REPS : 0) },
                  { label: 'Total Sets', value: totalSessionSets || (sessionActive ? currentSet : 0) },
                  { label: 'Peak Angle', value: `${Math.round(peakAngle)}°` },
                  { label: 'Avg Heart Rate', value: avgHR ? `${avgHR} BPM` : '—' },
                  { label: 'Session Duration', value: formatTime(sessionTime) },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 px-2 bg-slate-800/30 rounded-lg text-xs border border-slate-700/20">
                    <span className="text-slate-400">{s.label}</span>
                    <span className="text-white font-semibold">{s.value}</span>
                  </div>
                ))}
                <button
                  onClick={() => alert('Report exported!')}
                  className="w-full mt-2 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 text-xs font-medium flex items-center justify-center gap-2 transition-all border border-teal-500/30"
                >
                  <Download size={14} /> Export Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ DEVELOPER PANEL ═══════════ */}
      <div className="px-4 pb-4 max-w-[1920px] mx-auto w-full">
        <div className="bg-[#1e293b] rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
          <SectionHeader title="Developer Panel — Wokwi Integration Guide" icon={Code} sectionKey="devPanel"
            badge={<span className="ml-2 text-[9px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">⚙ DEV</span>}
          />
          {sectionsOpen.devPanel && (
            <div className="px-5 pb-5 space-y-5">
              {/* Step-by-step instructions */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Quick Start — Connect Wokwi to this Dashboard</h4>
                <div className="space-y-1.5">
                  {[
                    'Go to wokwi.com and create a new ESP32 project',
                    'Paste the Arduino code (below) into the sketch editor',
                    'Paste the diagram.json (below) into the diagram editor (F1 → "Load diagram.json")',
                    'Run the simulation — you\'ll see sensor output in the Serial Monitor',
                    'Copy the Project ID from the URL (e.g., wokwi.com/projects/123456789)',
                    'Paste the Project ID into the connection panel above and click "Connect to Wokwi"',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span className="text-xs text-slate-300 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-[11px] text-amber-400">
                    <strong>Note:</strong> Make sure your Wokwi simulation is running and connected to Blynk Cloud. The dashboard polls Blynk HTTP API every 1 second. Move the potentiometer sliders in Wokwi to change sensor values — they will appear here in real time via Blynk.
                  </p>
                </div>
              </div>

              {/* Arduino Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Cpu size={13} className="text-teal-400" />
                    Arduino / ESP32 Code — <span className="text-slate-500 font-normal">sketch.ino</span>
                  </h4>
                  <CopyButton text={ARDUINO_CODE} />
                </div>
                <div className="bg-[#0d1117] rounded-lg border border-slate-700/30 overflow-hidden">
                  <pre className="p-4 text-[11px] text-slate-300 font-mono leading-relaxed overflow-x-auto max-h-72 overflow-y-auto">
                    <code>{ARDUINO_CODE}</code>
                  </pre>
                </div>
              </div>

              {/* Diagram JSON */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Code size={13} className="text-teal-400" />
                    Wokwi diagram.json — <span className="text-slate-500 font-normal">paste into your Wokwi project</span>
                  </h4>
                  <CopyButton text={DIAGRAM_JSON} />
                </div>
                <div className="bg-[#0d1117] rounded-lg border border-slate-700/30 overflow-hidden">
                  <pre className="p-4 text-[11px] text-slate-300 font-mono leading-relaxed overflow-x-auto max-h-56 overflow-y-auto">
                    <code>{DIAGRAM_JSON}</code>
                  </pre>
                </div>
              </div>

              {/* Expected JSON format note */}
              <div className="p-3 bg-slate-800/50 border border-slate-700/30 rounded-lg">
                <h4 className="text-[11px] font-semibold text-slate-300 mb-1.5">Expected Serial Output Format (JSON)</h4>
                <pre className="text-[10px] text-teal-400 font-mono bg-slate-900/50 rounded p-2">
{`{"angle":87.5,"flex":72,"force":55,"hr":88,"temp":36.8,"emg":63,"reps":5,"sets":1,"hold":3}`}
                </pre>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Modify your Arduino <code className="text-teal-400/70">Serial.println()</code> to output this JSON format for the dashboard to parse it. Each line should be a complete JSON object.
                </p>
              </div>

              {/* Raw Serial Log */}
              <div className="space-y-2">
                <SectionHeader title="Raw Serial Log" icon={Terminal} sectionKey="serialLogPanel"
                  badge={serialLog.length > 0 ? (
                    <span className="ml-2 text-[9px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">{serialLog.length} lines</span>
                  ) : null}
                />
                {sectionsOpen.serialLogPanel && (
                  <div className="bg-[#0d1117] rounded-lg border border-slate-700/30 overflow-hidden">
                    <div className="p-3 max-h-48 overflow-y-auto font-mono text-[10px] space-y-0.5">
                      {serialLog.length === 0 ? (
                        <div className="text-slate-600 text-center py-4">
                          <Terminal size={16} className="mx-auto mb-1.5 text-slate-700" />
                          No serial data yet — connect to Wokwi to see raw output
                        </div>
                      ) : (
                        serialLog.map((line, i) => (
                          <div key={i} className={`leading-tight ${
                            line.includes('---') ? 'text-slate-600 italic' :
                            line.includes('{') ? 'text-emerald-400' :
                            'text-slate-400'
                          }`}>
                            {line}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
