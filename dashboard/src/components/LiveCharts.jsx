import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function LiveCharts({ historyData }) {
  if (!historyData || historyData.length === 0) {
    return (
      <div className="card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Waiting for telemetry to generate live charts...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2">
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600 }}>Knee Angle vs Time</h3>
        <div style={{ height: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, 140]} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-lg)' }}/>
              <Line type="monotone" dataKey="angle" stroke="var(--accent-blue)" strokeWidth={3} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600 }}>EMG & Force Signal</h3>
        <div style={{ height: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="time" hide />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-lg)' }}/>
              <Legend verticalAlign="top" height={36} iconType="circle"/>
              <Line type="monotone" dataKey="emg" stroke="var(--warning)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="force" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
