export default function SystemArchitecture() {
  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <h2 className="title" style={{ fontSize: '1.5rem' }}>System Architecture & Biomechanics</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        The Joint-Track Knee Rehab Sleeve integrates multiple sensors to collect biomechanical and physiological data, which is processed by an ESP32 microcontroller to compute the knee joint angle and exercise metrics in real time. The processed data is transmitted over Serial to this monitoring dashboard for advanced visualization.
      </p>
      
      <div className="grid grid-cols-3" style={{ gap: '1.5rem', alignItems: 'stretch' }}>
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '1rem' }}>Sensor Layer</h4>
          <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.875rem', flexGrow: 1 }}>
            <li style={{ marginBottom: '0.5rem' }}><strong>MPU6050 (x2):</strong> Upper and lower leg IMUs capturing tilt via I2C. Uses a Complementary Filter (alpha 0.96) to fuse noisy accelerometer data with drifting gyro data.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Flex Sensor:</strong> Placed on the joint for secondary bend estimate (ADC).</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>FSR402:</strong> Force sensor detecting overload/weight bearing.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>MyoWare Muscle Sensor:</strong> EMG detecting quad muscle activation.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>DS18B20:</strong> Temperature monitor for inflammation.</li>
            <li><strong>MAX30102:</strong> Heart rate and pulse oximetry.</li>
          </ul>
        </div>
        
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '1rem' }}>ESP32 Processing Layer</h4>
          <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.875rem', flexGrow: 1 }}>
            <li style={{ marginBottom: '0.5rem' }}>Runs a 100Hz real-time loop for IMU querying.</li>
            <li style={{ marginBottom: '0.5rem' }}>Computes <strong>fusedAngle</strong> weighing 70% IMU and 30% Flex sensor.</li>
            <li style={{ marginBottom: '0.5rem' }}>Internal State Machine tracks exercises through phases: EXTENDED, FLEXING, AT_TARGET, HOLDING, and RETURNING.</li>
            <li style={{ marginBottom: '0.5rem' }}>Fires overriding safety alerts on OVERBEND (above 130°) or OVERLOAD (high FSR).</li>
            <li>Transmits JSON telemetry every 500ms via Serial at 115200 baud.</li>
          </ul>
        </div>

        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '1rem' }}>Actuator Feedback Loop</h4>
          <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.875rem', flexGrow: 1 }}>
            <li style={{ marginBottom: '0.5rem' }}><strong>Haptic Motor:</strong> Provides vibrations when target angles are met or when errors occur.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Buzzer:</strong> Auditory beeps tracking rep completion and multi-beep alerts for limits.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>LED System:</strong> Visual physical indicators (e.g. Green for target reached, Red for dangerous flex).</li>
            <li><strong>OLED Display:</strong> On-device fast readout of live angle, reps, and physical state independently from the host computer.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
