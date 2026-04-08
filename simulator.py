import time
import math
import random

def _build_f(angle, force, emg, state, temp, hr, reps, sets, hold, session=True):
    return {
        "t": int(time.time() * 1000),
        "angle": round(angle, 1),
        "imuU": round(angle * 0.7 + random.uniform(-1, 1), 1),
        "imuL": round(angle * 0.3 + random.uniform(-0.5, 0.5), 1),
        "flex": round(angle + random.uniform(-1, 1), 1),
        "force": force,
        "emg": emg,
        "temp": temp,
        "hr": hr,
        "reps": reps,
        "sets": sets,
        "hold": hold,
        "state": state,
        "session": session
    }

class AdvancedSimulator:
    def __init__(self):
        self.state = "IDLE"
        self.angle = 0.0
        self.reps = 0
        self.sets = 0
        self.hold_time = 0.0
        self.session_active = False
        
        self.target_angle = 110.0
        self.start_time = 0
        self.cycle_duration = 6.0 # Total cycle variables
        self.temp_base = 36.5
        self.hr_base = 70.0

    def start_session(self):
        self.session_active = True
        self.state = "EXTENDED"
        self.reps = 0
        self.sets = 0
        self.hold_time = 0.0
        self.angle = 0.0
        self.start_time = time.time()
        self.temp_base = 35.0 # Starting temp
        self.hr_base = 70.0

    def get_telemetry(self):
        if not self.session_active:
            self.temp_base = max(34.0, self.temp_base - 0.02)
            self.hr_base = max(60.0, self.hr_base - 0.5)
            return _build_f(0, 50, 100, "IDLE", round(self.temp_base, 1), int(self.hr_base), self.reps, self.sets, 0.0, False)

        elapsed = time.time() - self.start_time
        # A full cycle is 9 seconds: 3s flex, 3s hold, 3s return
        cycle_time = elapsed % 9.0 
        
        # Real kinematic smooth movement phase engine
        if cycle_time < 3.0:
            self.state = "FLEXING"
            progress = cycle_time / 3.0
            # Sine wave logic for buttery smooth acceleration/deceleration
            self.angle = self.target_angle * math.sin(progress * (math.pi / 2))
            self.hold_time = 0.0
            
        elif cycle_time < 6.0:
            self.state = "HOLDING"
            # Micro-jitters indicating human muscular fluctuation
            self.angle = self.target_angle + random.uniform(-0.5, 0.5) 
            self.hold_time = cycle_time - 3.0
            
        elif cycle_time < 9.0:
            self.state = "RETURNING"
            progress = (cycle_time - 6.0) / 3.0
            self.angle = self.target_angle * math.cos(progress * (math.pi / 2))
            self.hold_time = 0.0
            
            # Calculate integer rep exactly at cycle end
            expected_reps = int(elapsed / 9.0)
            if expected_reps > self.reps:
                self.reps = expected_reps
                self.state = "EXTENDED"

        # Advanced Physiological Value Linking
        flex_ratio = self.angle / 110.0
        
        # Load exponentially increases deeper into the stretch
        force = int(50 + (math.pow(flex_ratio, 2) * 500) + random.randint(-15, 15))
        
        # Muscular recruitment (EMG) is highest during Flexion and Holding
        if self.state in ["FLEXING", "HOLDING"]:
            emg = int(200 + (flex_ratio * 1600) + random.randint(-30, 30))
        else:
            emg = int(120 + random.randint(-10, 10))
            
        # Vitals drifting organically
        self.temp_base = min(37.5, max(34.0, self.temp_base + random.uniform(-0.02, 0.03)))
        target_hr = 70 + (flex_ratio * 35) + (self.reps * 2) # HR raises slightly over sets
        self.hr_base += (target_hr - self.hr_base) * 0.1 # Exponential smoothing factor toward target #
        
        return _build_f(
            self.angle, force, emg, self.state, round(self.temp_base, 1), 
            int(self.hr_base), self.reps, self.sets, round(self.hold_time, 1), True
        )
