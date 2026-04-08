import { useState, useRef, useEffect } from 'react'
import './App.css'
import HeroHeader from './components/HeroHeader'
import ConnectionPanel from './components/ConnectionPanel'
import KneeGauge from './components/KneeGauge'
import MetricsPanel from './components/MetricsPanel'
import SensorMonitor from './components/SensorMonitor'
import LiveCharts from './components/LiveCharts'
import SystemArchitecture from './components/SystemArchitecture'

const HISTORY_LENGTH = 100; // retain 50 seconds of history (1 point per 500ms -> 100pts = 50s)

function App() {
  const [portParams, setPortParams] = useState({ connected: false, name: '' });
  const [sessionActive, setSessionActive] = useState(false);
  
  // Latest Telemetry
  const [telemetry, setTelemetry] = useState({
    t: 0,
    angle: 0,
    imuU: 0,
    imuL: 0,
    flex: 0,
    force: 0,
    emg: 0,
    temp: 0,
    hr: 0,
    reps: 0,
    sets: 0,
    hold: 0,
    state: 'IDLE',
    session: false
  });

  // History arrays for charts
  const [historyData, setHistoryData] = useState([]);
  
  const portRef = useRef(null);
  const readerRef = useRef(null);

  // Buffer for incoming serial chunks
  const jsonBuffer = useRef("");

  const handleConnect = async () => {
    try {
      if (!navigator.serial) {
        alert("Web Serial API not supported in this browser. Use Chrome/Edge desktop.");
        return;
      }
      
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 }); // Matches firmware.cpp
      portRef.current = port;
      setPortParams({ connected: true, name: 'USB Device' });
      
      readLoop(port);
      
    } catch (err) {
      console.error("Connection failed", err);
    }
  };

  const readLoop = async (port) => {
    while (port.readable && portRef.current) {
      const reader = port.readable.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            reader.releaseLock();
            break;
          }
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            jsonBuffer.current += chunk;
            
            // Process lines
            let lines = jsonBuffer.current.split('\n');
            jsonBuffer.current = lines.pop(); // Keep incomplete line in buffer
            
            for (let line of lines) {
              line = line.trim();
              if (line.startsWith('{') && line.endsWith('}')) {
                try {
                  const data = JSON.parse(line);
                  if (data.t !== undefined) {
                    setTelemetry(data);
                    setSessionActive(data.session);
                    
                    // Update chart history
                    if (data.angle !== undefined) {
                      setHistoryData(prev => {
                        const newPt = {
                          time: new Date().toLocaleTimeString('en-US',{hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'}),
                          angle: data.angle,
                          force: data.force,
                          emg: data.emg,
                          temp: data.temp
                        };
                        const next = [...prev, newPt];
                        if (next.length > HISTORY_LENGTH) next.shift();
                        return next;
                      });
                    }
                  }
                } catch(e) {
                  // Bad JSON line, ignore.
                }
              }
            }
          }
        }
      } catch (err) {
         console.warn("Reader error", err);
      } finally {
         reader.releaseLock();
      }
    }
  };

  const sendCommand = async (cmd) => {
    if (portRef.current && portRef.current.writable) {
      const writer = portRef.current.writable.getWriter();
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(cmd + '\n'));
      writer.releaseLock();
    }
  };

  const handleStart = () => sendCommand("START");
  const handleStop = () => sendCommand("STOP");
  const handleReset = () => sendCommand("RESET");
  
  return (
    <div className="dashboard-container">
      <HeroHeader />
      
      <div className="grid grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div style={{ gridColumn: 'span 1' }}>
          <ConnectionPanel 
            connected={portParams.connected}
            sessionActive={sessionActive}
            onConnect={handleConnect}
            onStart={handleStart}
            onStop={handleStop}
            onReset={handleReset}
          />
        </div>
        <div style={{ gridColumn: 'span 3' }}>
           <MetricsPanel telemetry={telemetry} />
        </div>
      </div>
      
      <div className="grid grid-cols-3" style={{ marginBottom: '1.5rem' }}>
         <div style={{ gridColumn: 'span 1' }}>
           <KneeGauge telemetry={telemetry} />
         </div>
         <div style={{ gridColumn: 'span 2' }}>
           <SensorMonitor telemetry={telemetry} />
         </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <LiveCharts historyData={historyData} />
      </div>

      <SystemArchitecture />
      
    </div>
  )
}

export default App
