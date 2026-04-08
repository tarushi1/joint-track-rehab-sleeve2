export default function KneeGauge({ telemetry }) {
  const angle = telemetry.angle;
  
  // Settings
  const MAX_ANGLE = 130;
  const targetAngle = 90;
  
  // Calculate SVG stroke properties
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  // Let's make it a semi-circle gauge or full circle. Full circle is easier.
  const strokeDashoffset = Math.max(0, circumference - (angle / MAX_ANGLE) * circumference);

  let color = 'var(--success)';
  if (angle > MAX_ANGLE - 10) color = 'var(--danger)'; // approaching limit
  else if (angle < 20) color = 'var(--text-muted)';
  else if (angle > targetAngle - 10 && angle < targetAngle + 10) color = 'var(--success)';
  else color = 'var(--accent-blue)';

  return (
    <div className="card" style={{ textAlign: 'center', height: '100%' }}>
      <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600 }}>Live Knee Angle</h3>
      
      <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
        <svg fill="transparent" stroke="currentColor" width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          <circle 
            style={{ color: '#e5e7eb' }} 
            strokeWidth="16" 
            r={radius} 
            cx="100" 
            cy="100" 
          />
          <circle 
            style={{ 
              color: color, 
              transition: 'stroke-dashoffset 0.5s ease, color 0.3s ease' 
            }} 
            strokeWidth="16" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
            r={radius} 
            cx="100" 
            cy="100" 
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>{Number(angle).toFixed(1)}°</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ 130°</span>
        </div>
      </div>
      
      <div style={{ marginTop: '1.5rem' }}>
        <p style={{ margin: 0, fontWeight: 600, color: color }}>Target: {targetAngle}°</p>
      </div>
    </div>
  )
}
