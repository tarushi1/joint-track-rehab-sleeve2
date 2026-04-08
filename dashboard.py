import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import serial
import serial.tools.list_ports
import json
import time
import math
from simulator import AdvancedSimulator

# --- PAGE CONFIG ---
st.set_page_config(page_title="Joint-Track HD Medical", page_icon="🦿", layout="wide")

# --- MASTER CSS: Sleek, Hover-enhanced, Spaced ---
st.markdown("""
<style>
    /* Dark Pro Theme */
    [data-testid="stAppViewContainer"] {
        background-color: #0b111b; color: #e2e8f0; font-family: 'Inter', sans-serif;
        background-image: radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 50%);
    }

    /* Reduce top padding */
    .stMainBlockContainer {
        padding-top: 2rem !important;
    }

    .demo-badge {
        background: rgba(56, 189, 248, 0.2);
        color: #38bdf8;
        padding: 4px 14px;
        border-radius: 50px;
        font-weight: 800;
        font-size: 13px;
        vertical-align: middle;
        margin-left: 12px;
        text-transform: uppercase;
        border: 1px solid rgba(56, 189, 248, 0.3);
        box-shadow: 0 0 20px rgba(56, 189, 248, 0.15);
    }
    
    /* GLASS STYLE CARDS */
    .metric-card {
        background: rgba(30, 41, 59, 0.35);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 22px; 
        padding: 26px; 
        margin-bottom: 30px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        border: 1px solid rgba(255, 255, 255, 0.08);
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        text-align: center;
    }
    
    .metric-card:hover {
        transform: translateY(-6px);
        background: rgba(30, 41, 59, 0.5);
        box-shadow: 0 15px 45px -10px rgba(0,0,0,0.6);
        border: 1px solid rgba(56, 189, 248, 0.3);
    }
    
    .metric-title {
        color: rgba(148, 163, 184, 0.7); 
        font-size: 13px; font-weight: 700; 
        text-transform: uppercase; letter-spacing: 2.5px; margin-bottom: 15px;
    }
    
    .metric-value { 
        font-size: 56px; font-weight: 800; color: #38bdf8; 
        transition: all 0.3s ease;
        line-height: 1;
        text-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
    }

    .alert-banner {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(153, 27, 27, 0.9) 100%);
        backdrop-filter: blur(10px);
        color: white; padding: 22px; border-radius: 18px;
        text-align: center; font-weight: 800; font-size: 22px;
        letter-spacing: 2px; animation: pulseAlert 0.8s infinite alternate; 
        margin-bottom: 35px; box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.4);
        border: 1px solid rgba(252, 165, 165, 0.3);
    }
    @keyframes pulseAlert { 0% { opacity: 0.9; transform: scale(0.995); } 100% { opacity: 1; transform: scale(1.005); } }
    
    .state-pulse-holding {
        display: inline-block; padding: 8px 22px; border-radius: 50px;
        background: linear-gradient(90deg, #10b981, #059669);
        color: white; font-weight: 800; font-size: 18px;
        animation: holdPulse 1.8s infinite; letter-spacing: 1px;
        box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
    }
    @keyframes holdPulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.8); } 70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
    
    .state-badge {
        display: inline-block; padding: 8px 22px; border-radius: 50px;
        color: white; font-weight: 800; font-size: 18px; letter-spacing: 1px;
        background: rgba(71, 85, 105, 0.4);
        border: 1px solid rgba(148, 163, 184, 0.2);
    }

</style>
""", unsafe_allow_html=True)

# --- STATE VARIABLES ---
if 'history' not in st.session_state:
    st.session_state.history = pd.DataFrame(columns=['Time', 'Angle', 'EMG', 'Force', 'Temp'])
if 'telemetry' not in st.session_state:
    st.session_state.telemetry = {
        "angle": 0, "imuU": 0, "imuL": 0, "flex": 0, "force": 0, "emg": 0, "temp": 34.0,
        "hr": 60, "reps": 0, "sets": 0, "hold": 0.0, "state": "IDLE", "session": False
    }
if 'sim' not in st.session_state:
    st.session_state.sim = AdvancedSimulator()
if 'serial_conn' not in st.session_state:
    st.session_state.serial_conn = None

if 'analytics' not in st.session_state:
    st.session_state.analytics = {
        "max_angle": 0.0, "hold_angles": [], "flex_emgs": [], "max_force": 0, 
        "all_angles": [], "fatigue_index": 0.0, "start_emg": 0.0
    }

def update_history(data):
    new_row = pd.DataFrame([{
        'Time': pd.Timestamp.now().strftime('%H:%M:%S.%f')[:-4], # Includes sub-second for fast scrolling precision
        'Angle': data['angle'],
        'EMG': data['emg'],
        'Force': data['force'],
        'Temp': data['temp']
    }])
    # Keeps exactly ~30 seconds of data assuming a 400ms tick (roughly 75 array frames)
    st.session_state.history = pd.concat([st.session_state.history, new_row], ignore_index=True).tail(75)  

# --- SIDEBAR: CLEAN LAYOUT ---
st.sidebar.title("🦿 System Dashboard")
st.sidebar.markdown("---")

st.sidebar.subheader("📡 Connection Profile")
mode = st.sidebar.radio("Select Interface", ["Simulation Engine", "Live Serial Dev"], label_visibility="collapsed")

if mode == "Live Serial Dev":
    st.sidebar.markdown("")
    ports = [p.device for p in serial.tools.list_ports.comports()]
    selected_port = st.sidebar.selectbox("USB Port", ports if ports else ["No Ports"])
    baud = st.sidebar.selectbox("Baud Rate", [115200])
    if st.sidebar.button("Hardware Connect", width="stretch") and selected_port != "No Ports":
        try:
            st.session_state.serial_conn = serial.Serial(selected_port, baud, timeout=1)
            st.sidebar.success(f"Linked: {selected_port}")
        except Exception as e:
            st.sidebar.error(f"Error: {e}")

st.sidebar.markdown("---")
st.sidebar.subheader("🕹️ Session Controls")
btn_col1, btn_col2 = st.sidebar.columns(2)

if btn_col1.button("▶ START DEMO", type="primary", width="stretch"):
    st.session_state.analytics = {
        "max_angle": 0.0, "hold_angles": [], "flex_emgs": [], "max_force": 0, 
        "all_angles": [], "fatigue_index": 0.0, "start_emg": 0.0
    }
    if mode == "Simulation Engine":
        st.session_state.sim.start_session()
    elif st.session_state.serial_conn:
        st.session_state.serial_conn.write(b"START\n")

if btn_col2.button("⏹ Stop", width="stretch"):
    if mode == "Simulation Engine":
        st.session_state.sim.session_active = False
        st.session_state.sim.state = "IDLE"
    elif st.session_state.serial_conn:
        st.session_state.serial_conn.write(b"STOP\n")

# --- MAIN ENGINE LOOP ---
if mode == "Simulation Engine":
    t = st.session_state.sim.get_telemetry()
    st.session_state.telemetry = t
    update_history(t)
elif mode == "Live Serial Dev" and st.session_state.serial_conn and st.session_state.serial_conn.in_waiting:
    try:
        line = st.session_state.serial_conn.readline().decode('utf-8').strip()
        t = json.loads(line)
        st.session_state.telemetry = t
        update_history(t)
    except: pass
    
t = st.session_state.telemetry

# --- ANALYTICS COMPUTATION ---
if t["session"]:
    a = st.session_state.analytics
    a["max_angle"] = max(a["max_angle"], t["angle"])
    a["max_force"] = max(a["max_force"], t["force"])
    a["all_angles"].append(t["angle"])
    if t["state"] == "HOLDING":
        a["hold_angles"].append(t["angle"])
    if t["state"] == "FLEXING":
        a["flex_emgs"].append(t["emg"])
        # Set baseline EMG from first few samples
        if a["start_emg"] == 0 and len(a["flex_emgs"]) > 5:
            a["start_emg"] = sum(a["flex_emgs"][:5]) / 5
        # Fatigue trend: ratio of current EMG vs early EMG (normalized to flexion approx)
        if a["start_emg"] > 0:
            current_emg = sum(a["flex_emgs"][-5:]) / 5
            raw_fatigue = (current_emg / a["start_emg"]) - 1.0
            a["fatigue_index"] = max(0.0, min(100.0, raw_fatigue * 100))

badge_html = "<span class='demo-badge'>DEMO MODE</span>" if mode == "Simulation Engine" else ""
st.markdown(f"<h1 style='text-align: center; color: white; margin-bottom: 0px;'>JOINT-TRACK<span style='color:#38bdf8'>PRO</span> {badge_html}</h1>", unsafe_allow_html=True)
st.markdown("<p style='text-align: center; color: #94a3b8; font-size: 16px; margin-bottom: 40px; letter-spacing: 3px;'>CLINICAL BIOMECHANICS TERMINAL</p>", unsafe_allow_html=True)

if "OVERBEND" in t["state"]:
    st.markdown("<div class='alert-banner'>⚠️ CRITICAL: HYPER-EXTENSION / OVERBEND</div>", unsafe_allow_html=True)

# TOP VITALS
c1, c2, c3, c4 = st.columns(4)

def v_state(s):
    if "HOLD" in s: return f"<div class='state-pulse-holding'>HOLD 3s TARGET</div>"
    if "TARGET" in s: return f"<div class='state-badge' style='background: #10b981;'>TARGET ANGLE HIT</div>"
    if "FLEX" in s: return f"<div class='state-badge' style='background: #f59e0b;'>FLEXING</div>"
    if "RETURN" in s: return f"<div class='state-badge' style='background: #38bdf8;'>RETURNING</div>"
    return f"<div class='state-badge' style='background: #475569;'>IDLE / STANDING</div>"

with c1: st.markdown(f'<div class="metric-card"><div class="metric-title">Live Phase</div><div style="margin-top:10px;">{v_state(t["state"])}</div></div>', unsafe_allow_html=True)
with c2: st.markdown(f'<div class="metric-card"><div class="metric-title">Count (Reps)</div><div class="metric-value" style="color:#a855f7;">{t["reps"]}</div></div>', unsafe_allow_html=True)
with c3: st.markdown(f'<div class="metric-card"><div class="metric-title">Skin Celsius</div><div class="metric-value">{(t["temp"])}°C</div></div>', unsafe_allow_html=True)
with c4: st.markdown(f'<div class="metric-card"><div class="metric-title">Heart Rate</div><div class="metric-value" style="color:#f43f5e;">{t["hr"]} <span style="font-size:18px">BPM</span></div></div>', unsafe_allow_html=True)

# HINGE JOINT AND GAUGE
st.markdown("<h3 style='color: white; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 30px;'>Geometric Kinematics</h3>", unsafe_allow_html=True)
col_mech, col_rad = st.columns([1.5, 1])

with col_mech:
    # Build segmented HINGE JOINT visualization
    thigh_length = 50.0
    calf_length = 45.0
    
    # Hip Fixed Top
    x_hip, y_hip = 0, thigh_length
    # Knee Fixed Center
    x_knee, y_knee = 0, 0
    # Ankle Rotating dynamically based on telemetry angle
    theta = math.radians(t['angle'])
    x_ankle = calf_length * math.sin(theta)
    y_ankle = -calf_length * math.cos(theta)
    
    fig_joint = go.Figure()
    
    # UPPER LEG (Thigh)
    fig_joint.add_trace(go.Scatter(
        x=[x_hip, x_knee], y=[y_hip, y_knee], mode='lines',
        line=dict(color='#38bdf8', width=24, shape='linear'), hoverinfo='none'
    ))
    
    # LOWER LEG (Calf)
    fig_joint.add_trace(go.Scatter(
        x=[x_knee, x_ankle], y=[y_knee, y_ankle], mode='lines',
        line=dict(color='#818cf8', width=20, shape='linear'), hoverinfo='none'
    ))
    
    # KNEE HINGE NODE (GLOWING)
    fig_joint.add_trace(go.Scatter(
        x=[x_knee], y=[y_knee], mode='markers',
        marker=dict(size=45, color='#0f172a', 
                    line=dict(color='#10b981', width=8), 
                    opacity=1), 
        hoverinfo='none'
    ))
    
    # HIP / ANKLE TERMINALS
    fig_joint.add_trace(go.Scatter(
        x=[x_hip, x_ankle], y=[y_hip, y_ankle], mode='markers',
        marker=dict(size=28, color='#475569', 
                    line=dict(color='white', width=3)),
        hoverinfo='none'
    ))
    
    fig_joint.update_layout(
        xaxis=dict(range=[-10, 60], visible=False, fixedrange=True),
        yaxis=dict(range=[-60, 60], visible=False, scaleanchor="x", scaleratio=1, fixedrange=True),
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        margin=dict(r=0,l=0,b=0,t=0), height=350, showlegend=False
    )
    st.plotly_chart(fig_joint)

with col_rad:
    # High polish transition radial gauge
    gauge_cl = "#10b981"
    if t["angle"] > 115: gauge_cl = "#ef4444"
    elif t["angle"] > 100: gauge_cl = "#38bdf8"
    elif t["angle"] > 80: gauge_cl = "#fbbf24"
    
    fig_rad = go.Figure(go.Indicator(
        mode = "gauge+number", value = t["angle"], 
        number={'suffix':'°', 'font':{'size':64, 'color':'white', 'family':'Inter', 'weight':800}},
        gauge = {
            'axis': {'range': [0, 140], 'tickwidth': 2, 'tickcolor': "rgba(255,255,255,0.5)"},
            'bar': {'color': gauge_cl, 'thickness': 0.8},
            'bgcolor': "rgba(30, 41, 59, 0.2)",
            'borderwidth': 1,
            'bordercolor': "rgba(255,255,255,0.1)",
            'steps': [
                {'range': [95, 110], 'color': 'rgba(16, 185, 129, 0.2)'}, 
                {'range': [120, 140], 'color': 'rgba(239, 68, 68, 0.2)'} 
            ],
        }
    ))
    fig_rad.update_layout(paper_bgcolor="rgba(0,0,0,0)", height=350, margin=dict(t=0,b=0,l=10,r=10))
    st.plotly_chart(fig_rad)


# SCROLLING LIVE CHARTS
st.markdown("<h3 style='color: white; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 30px; margin-top: 20px;'>Live Streaming Diagnostics</h3>", unsafe_allow_html=True)

if not st.session_state.history.empty:
    clc1, clc2 = st.columns(2)
    
    layout_opts = dict(
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#cbd5e1", family="Inter"), margin=dict(t=40, l=40, r=20, b=40),
        xaxis=dict(showgrid=True, gridcolor="rgba(255, 255, 255, 0.05)", showticklabels=False),
        yaxis=dict(showgrid=True, gridcolor="rgba(255, 255, 255, 0.05)", zeroline=False),
        height=300, hovermode="x unified"
    )
    
    fig_a = go.Figure()
    fig_a.add_trace(go.Scatter(
        x=st.session_state.history['Time'], y=st.session_state.history['Angle'], 
        mode='lines', name='Angle (°)', 
        line=dict(color='#38bdf8', width=5, shape='spline'), 
        fill='tozeroy', fillcolor='rgba(56, 189, 248, 0.1)'
    ))
    fig_a.update_layout(**layout_opts, yaxis_range=[0, 140], title="Knee Flexion Trajectory")
    with clc1: st.plotly_chart(fig_a, width="stretch")
        
    fig_sef = go.Figure()
    # EMG Glowing Trace logic: Add a subtle thick under-shadow line
    fig_sef.add_trace(go.Scatter(
        x=st.session_state.history['Time'], y=st.session_state.history['EMG'], 
        mode='lines', name='EMG Shadow', 
        line=dict(color='rgba(234, 179, 8, 0.2)', width=12, shape='spline'),
        showlegend=False, hoverinfo='none'
    ))
    fig_sef.add_trace(go.Scatter(
        x=st.session_state.history['Time'], y=st.session_state.history['EMG'], 
        mode='lines', name='Myo-EMG (mV)', 
        line=dict(color='#eab308', width=4, shape='spline')
    ))
    fig_sef.add_trace(go.Scatter(
        x=st.session_state.history['Time'], y=st.session_state.history['Force']/2, 
        mode='lines', name='Load Force (N/2)', 
        line=dict(color='#a855f7', width=4, shape='spline', dash='dot')
    ))
    fig_sef.update_layout(**layout_opts, title="Muscular Logic & Load Bearing", legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1))
    with clc2: st.plotly_chart(fig_sef, width="stretch")

# --- SESSION ANALYTICS SECTION ---
st.markdown("<h3 style='color: white; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 30px; margin-top: 50px;'>📊 Session Analytics</h3>", unsafe_allow_html=True)

ar1_c1, ar1_c2, ar1_c3 = st.columns(3)
ar2_c1, ar2_c2, ar2_c3 = st.columns(3)

a = st.session_state.analytics
avg_hold = sum(a["hold_angles"]) / len(a["hold_angles"]) if a["hold_angles"] else 0.0
avg_emg = sum(a["flex_emgs"]) / len(a["flex_emgs"]) if a["flex_emgs"] else 0.0

with ar1_c1: st.markdown(f'<div class="metric-card"><div class="metric-title">Max Flexion</div><div class="metric-value" style="color:#0ea5e9;">{a["max_angle"]:.1f}°</div></div>', unsafe_allow_html=True)
with ar1_c2: st.markdown(f'<div class="metric-card"><div class="metric-title">Avg Hold Stability</div><div class="metric-value" style="color:#10b981;">{avg_hold:.1f}°</div></div>', unsafe_allow_html=True)
with ar1_c3: st.markdown(f'<div class="metric-card"><div class="metric-title">Total Repetitions</div><div class="metric-value" style="color:#a855f7;">{t["reps"]}</div></div>', unsafe_allow_html=True)

with ar2_c1: st.markdown(f'<div class="metric-card"><div class="metric-title">Avg Flexion EMG</div><div class="metric-value" style="color:#eab308;">{int(avg_emg)} <span style="font-size:16px">mV</span></div></div>', unsafe_allow_html=True)
with ar2_c2: st.markdown(f'<div class="metric-card"><div class="metric-title">Peak Load Force</div><div class="metric-value" style="color:#f43f5e;">{a["max_force"]} <span style="font-size:16px">N</span></div></div>', unsafe_allow_html=True)
with ar2_c3: st.markdown(f'<div class="metric-card"><div class="metric-title">Fatigue Index</div><div class="metric-value" style="color:#fb7185;">{a["fatigue_index"]:.1f}%</div></div>', unsafe_allow_html=True)

# KNEE ANGLE DISTRIBUTION
if a["all_angles"]:
    st.markdown("<p style='color: #94a3b8; font-size: 14px; margin-top: 20px;'>Knee Angle Distribution Profile</p>", unsafe_allow_html=True)
    fig_dist = go.Figure(data=[go.Histogram(
        x=a["all_angles"], 
        nbinsx=40, 
        marker_color='#38bdf8', 
        opacity=0.7,
        hovertemplate='Angle: %{x}°<br>Count: %{y}<extra></extra>'
    )])
    fig_dist.update_layout(
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#cbd5e1", family="Inter"),
        margin=dict(t=10, l=40, r=20, b=40),
        xaxis=dict(title="Joint Angle (degrees)", showgrid=False),
        yaxis=dict(title="Sample Count", showgrid=True, gridcolor="rgba(255, 255, 255, 0.05)"),
        height=250,
        bargap=0.1
    )
    st.plotly_chart(fig_dist, width="stretch")

# Main control loop pacing
time.sleep(0.25)
st.rerun()
