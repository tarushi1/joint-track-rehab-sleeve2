import time
import json
import random
import serial
import serial.tools.list_ports

def main():
    print("-------------------------------------------------")
    print(" Joint-Track Knee Rehab - Sample Data Simulator")
    print("-------------------------------------------------")
    
    # We will use serial loopback if available, or just print to terminal if testing
    # For a real pipeline, you would use a virtual serial port (like com0com for Windows, or socio/pty for Linux/Mac)
    # But for demonstration without a real ESP32, we'll just act as the ESP32 writing to standard out.
    
    angle = 0
    state = "EXTENDED"
    reps = 0
    sets = 0
    hold = 0.0
    
    session = False
    
    try:
        while True:
            # Simulate movement
            if state == "EXTENDED":
                angle += random.uniform(0, 5)
                if angle > 15:
                    state = "FLEXING"
            elif state == "FLEXING":
                angle += random.uniform(5, 15)
                if angle >= 90:
                    state = "AT_TARGET"
            elif state == "AT_TARGET":
                state = "HOLDING"
                hold_start = time.time()
            elif state == "HOLDING":
                hold += 0.5
                if hold >= 3.0:
                    state = "RETURNING"
            elif state == "RETURNING":
                angle -= random.uniform(5, 15)
                if angle <= 10:
                    angle = max(0, angle)
                    state = "EXTENDED"
                    reps += 1
                    hold = 0.0
                    if reps > 0 and reps % 10 == 0:
                        sets += 1
            
            # Simulated spikes
            force = random.randint(100, 800)
            if random.random() < 0.05:
                # Occasional overload
                force = 3500
                state = "OVERLOAD"
            elif random.random() < 0.05 and angle > 90:
                # Occasional overbend
                angle = 135
                state = "OVERBEND"
                
            payload = {
                "t": int(time.time() * 1000),
                "angle": round(angle, 1),
                "imuU": round(time.time() % 90, 1),
                "imuL": round(time.time() % 45, 1),
                "flex": round(angle + random.uniform(-2, 2), 1),
                "force": force,
                "emg": random.randint(400, 2000),
                "temp": round(36.5 + random.uniform(-0.1, 0.5), 1),
                "hr": random.randint(70, 100),
                "reps": reps,
                "sets": sets,
                "hold": hold,
                "state": state,
                "session": True
            }
            
            print(json.dumps(payload), flush=True)
            time.sleep(0.5)

    except KeyboardInterrupt:
        print("\nSimulator stopped.")

if __name__ == "__main__":
    main()
