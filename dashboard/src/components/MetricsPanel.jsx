export default function MetricsPanel({ telemetry }) {
  const isOverbend = telemetry.state === 'OVERBEND' || telemetry.state === 'STATE_OVERBEND_ALERT';
  const isOverload = telemetry.state === 'OVERLOAD' || telemetry.state === 'STATE_OVERLOAD_ALERT';
  const hasAlert = isOverbend || isOverload;

  const getStateBadge = (state) => {
    switch (state) {
      case 'IDLE': return <span className="badge badge-neutral">IDLE</span>;
      case 'EXTENDED': return <span className="badge badge-info">EXTENDED</span>;
      case 'FLEXING': return <span className="badge badge-warning">FLEXING</span>;
      case 'AT_TARGET': return <span className="badge badge-success">AT TARGET</span>;
      case 'HOLDING': return <span className="badge badge-success" style={{ animation: 'pulse 1s infinite' }}>HOLDING</span>;
      case 'RETURNING': return <span className="badge badge-info">RETURNING</span>;
      case 'OVERBEND': 
      case 'STATE_OVERBEND_ALERT': return <span className="badge badge-danger">OVERBEND</span>;
      case 'OVERLOAD':
      case 'STATE_OVERLOAD_ALERT': return <span className="badge badge-danger">OVERLOAD</span>;
      default: return <span className="badge badge-neutral">{state.replace('STATE_', '')}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {hasAlert && (
        <div className="alert-banner" style={{ margin: 0 }}>
          <svg style={{ width: '32px', height: '32px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {isOverbend ? 'DANGER: OVERBEND DETECTED' : 'DANGER: OVERLOAD DETECTED'}
        </div>
      )}

      <div className="grid grid-cols-4" style={{ flexGrow: 1, gap: '1.5rem' }}>
        <div className="card">
          <div className="metric-label">Exercise State</div>
          <div style={{ marginTop: '0.75rem' }}>{getStateBadge(telemetry.state)}</div>
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Session: {telemetry.session ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="card">
          <div className="metric-label">Repetitions</div>
          <div className="metric-value" style={{ marginTop: '0.5rem', color: 'var(--accent-blue)' }}>{telemetry.reps}</div>
        </div>

        <div className="card">
          <div className="metric-label">Sets</div>
          <div className="metric-value" style={{ marginTop: '0.5rem', color: 'var(--accent-blue)' }}>{telemetry.sets}</div>
        </div>

        <div className="card">
          <div className="metric-label">Hold Duration</div>
          <div className="metric-value" style={{ marginTop: '0.5rem', color: 'var(--success)' }}>
            {Number(telemetry.hold).toFixed(1)}<span style={{ fontSize: '1.25rem' }}>s</span>
          </div>
        </div>
      </div>
    </div>
  )
}
