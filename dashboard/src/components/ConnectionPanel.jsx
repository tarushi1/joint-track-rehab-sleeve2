import { Activity, Power, Square, RotateCcw } from 'lucide-react';

export default function ConnectionPanel({ connected, sessionActive, onConnect, onStart, onStop, onReset }) {
  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600 }}>Connection & Controls</h3>
      
      {!connected ? (
        <button className="btn btn-primary" onClick={onConnect} style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem', padding: '1rem' }}>
          Connect to ESP32 Serial Port
        </button>
      ) : (
        <div style={{ padding: '1rem', background: 'var(--accent-light)', color: 'var(--accent-blue)', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Activity size={18} /> Connected
        </div>
      )}

      <div style={{ display: 'grid', gap: '0.75rem', marginTop: 'auto' }}>
        <button 
          className="btn" 
          onClick={onStart}
          disabled={!connected || sessionActive}
          style={{ background: connected && !sessionActive ? 'var(--success)' : '#e5e7eb', color: connected && !sessionActive ? 'white' : '#9ca3af', width: '100%', justifyContent: 'center' }}
        >
          <Power size={18} /> Start Session
        </button>

        <button 
          className="btn" 
          onClick={onStop}
          disabled={!connected || !sessionActive}
          style={{ background: connected && sessionActive ? 'var(--warning)' : '#e5e7eb', color: connected && sessionActive ? 'white' : '#9ca3af', width: '100%', justifyContent: 'center' }}
        >
          <Square size={18} /> Stop Session
        </button>

        <button 
          className="btn btn-outline" 
          onClick={onReset}
          disabled={!connected}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <RotateCcw size={18} /> Reset Exercise
        </button>
      </div>
    </div>
  )
}
