import { Thermometer, Heart, Activity, ArrowRightLeft, AlignVerticalSpaceAround, AlignHorizontalSpaceAround } from 'lucide-react';

export default function SensorMonitor({ telemetry }) {
  return (
    <div className="card" style={{ height: '100%' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600 }}>Live Sensor Vitals</h3>
      
      <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
        
        <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '0.5rem', fontWeight: 600 }}><Thermometer size={16}/> Temp</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Number(telemetry.temp).toFixed(1)}°C</div>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ec4899', marginBottom: '0.5rem', fontWeight: 600 }}><Heart size={16}/> Heart Rate</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{telemetry.hr} BPM</div>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', marginBottom: '0.5rem', fontWeight: 600 }}><Activity size={16}/> EMG Signal</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{telemetry.emg}</div>
        </div>
        
        <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6', marginBottom: '0.5rem', fontWeight: 600 }}><AlignVerticalSpaceAround size={16}/> Force Sensor</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{telemetry.force}</div>
        </div>
        
        <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.5rem', fontWeight: 600 }}><ArrowRightLeft size={16}/> Flex Sensor</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{telemetry.flex}°</div>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', marginBottom: '0.5rem', fontWeight: 600 }}><AlignHorizontalSpaceAround size={16}/> Upper/Lower IMU</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Number(telemetry.imuU).toFixed(1)}° / {Number(telemetry.imuL).toFixed(1)}°</div>
        </div>

      </div>
    </div>
  )
}
