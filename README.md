# Joint-Track Knee Rehab Sleeve

Smart IoT wearable system for monitoring knee rehabilitation exercises.

This project was developed as part of the **Embedded Systems and Internet of Things course**.

The system is designed to help patients recovering from knee injuries perform physiotherapy exercises correctly by monitoring joint movement and physiological signals in real time.

---

# Project Overview

Patients recovering from ACL surgery or knee injuries are often required to perform physiotherapy exercises regularly to regain mobility and strength. However, many of these exercises are performed at home without supervision.

Because patients cannot accurately judge the required knee bending angles (such as 45°, 60°, or 90°), exercises may be performed incorrectly, which can slow recovery or cause additional strain on the joint.

The **Joint-Track Knee Rehab Sleeve** solves this problem by providing a smart wearable device that tracks knee motion and provides real-time feedback.

The system monitors:

- Knee flexion angle
- Muscle activation (EMG)
- Load force on the knee
- Knee temperature
- Heart rate
- Exercise repetitions and hold duration

The collected data is analyzed and displayed on a monitoring dashboard.

---

# System Architecture

The system consists of four main layers:

### 1. Sensor Layer
Multiple sensors collect biomechanical and physiological data from the knee.

Sensors used include:

- MPU6050 IMU sensors (upper leg and lower leg)
- Flex sensor
- Force sensor (FSR)
- EMG muscle sensor
- Temperature sensor
- Heart rate sensor

---

### 2. Processing Layer

The **ESP32 microcontroller** acts as the central processing unit.

Responsibilities include:

- Reading sensor data
- Calculating knee joint angle
- Tracking repetitions
- Measuring hold duration
- Processing exercise metrics

---

### 3. Feedback Layer

The system provides real-time feedback using actuators:

- **Buzzer** – audio alerts when target angle is reached
- **LED indicator** – visual feedback
- **Vibration motor** – haptic feedback

This helps the patient correct their movements immediately.

---

### 4. Monitoring Layer

Processed data is transmitted via **Bluetooth Low Energy (BLE)** to a monitoring dashboard.

The dashboard visualizes:

- Knee flexion angle
- Muscle activation
- Load force
- Temperature
- Heart rate
- Repetition tracking
- Exercise analytics

The system also includes a **simulation mode** to demonstrate the project without physical hardware.

---

# Hardware Components

### Microcontroller
**ESP32 Dev Module**

Reasons for selection:

- Built-in WiFi and Bluetooth
- Dual-core processor (240 MHz)
- Multiple ADC and I2C interfaces
- Low power consumption
- Suitable for wearable IoT systems

---

### Sensors

**MPU6050 (2 units)**  
Measures orientation of upper and lower leg to calculate knee angle.

**Flex Sensor**  
Measures bending of the knee directly.

**FSR402 Force Sensor**  
Measures load applied on the knee during exercises.

**MyoWare EMG Sensor**  
Measures muscle activation in the quadriceps.

**MAX30102 Heart Rate Sensor**  
Monitors heart rate during physiotherapy.

**DS18B20 Temperature Sensor**  
Measures knee surface temperature.

---

### Actuators

**Buzzer**  
Provides audio alerts for correct angle or incorrect movement.

**LED Indicator**  
Displays system status and movement correctness.

**Vibration Motor**  
Provides haptic feedback directly to the wearable sleeve.

---

# Software Components

### Firmware (ESP32)

This file contains the embedded firmware running on the ESP32.

Responsibilities:

- Sensor data acquisition
- Knee angle calculation
- Exercise tracking
- Feedback control

---

### Python Backend
dashboard.py
simulator.py
sample_data_generator.py


These scripts power the monitoring system.

**dashboard.py**

Runs the Streamlit monitoring dashboard.

**simulator.py**

Simulates sensor data when hardware is not connected.

**sample_data_generator.py**

Generates sample telemetry data for testing.

---

### Frontend Dashboard

dashboard/


This folder contains a **React + Vite web dashboard** for visualizing sensor data.

Main components include:

- LiveCharts.jsx
- MetricsPanel.jsx
- SensorMonitor.jsx
- SystemArchitecture.jsx
- KneeGauge.jsx

The dashboard displays real-time telemetry and analytics.

---

# Running the Dashboard

### Activate virtual environment
source venv/bin/activate


### Install dependencies


pip install -r requirements.txt


### Run dashboard


streamlit run dashboard.py


Open the browser at:


http://localhost:8501


---

# Key Features

- Real-time knee angle monitoring
- Multi-sensor fusion for accurate movement detection
- Physiological monitoring
- Wearable feedback system
- Exercise repetition tracking
- Rehabilitation analytics
- Simulation mode for testing
- Real-time data visualization

---

# Project Status

**Current Status:**  
✅ Hardware prototype complete  
✅ Firmware functional  
✅ Backend processing implemented  
✅ Dashboard operational  
✅ Simulation mode available

---

# Future Enhancements

- Mobile app integration (Android/iOS)
- Cloud data storage and analytics
- Machine learning for personalized rehab plans
- Gamification to improve patient motivation
- Wireless charging for wearable device
- Improved sensor fusion algorithms

---



# Course Information

**Course:** Embedded Systems and Internet of Things  
**Institution:** VIT Vellore  
**Project:** Joint-Track Knee Rehab Sleeve

---

# License

This project is developed for educational purposes as part of a university course. All rights reserved.
