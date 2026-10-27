# Airport Traffic Control (ATC) — OS Process State Transition Simulator

An interactive, educational web application simulating the dynamic 5-state Operating System process lifecycle through the real-world analogy of an **Airport Traffic Control Center**. Built for college Operating Systems presentations, computer science coursework, and interactive classroom learning.

![Operating Systems Process State Machine](https://img.shields.io/badge/OS-Process%20State%20Visualizer-blue)
![Theme](https://img.shields.io/badge/Metaphor-Airport%20Traffic%20Control-0284c7)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Vanilla%20Web)-brightgreen)
![License](https://img.shields.io/badge/License-MIT-orange)

---

## ✈️ The Real-World Airport Analogy

To make abstract Operating System concepts intuitive and engaging, the visualizer maps each OS process lifecycle state directly to real-world airport operations:

| Airport Operational Zone | OS Process Lifecycle State | Analogy Description |
|:---|:---|:---|
| **Airspace Arrival Bay** | 🟣 **NEW** | Aircraft entering terminal airspace; PCB and flight plan data structures allocated. |
| **Taxiway Alpha Queue** | 🔵 **READY** | Aircraft cleared for flight, lined up in FIFO order awaiting runway access. |
| **Active Runway 09L** | 🟢 **RUNNING** | Single CPU core. **Strict single occupancy (mutual exclusion)**: only one aircraft on runway at a time. |
| **Holding Apron & De-icing** | 🟠 **WAITING / Blocked** | Aircraft suspended for weather clearance or maintenance (I/O). Cannot use runway until event finishes. |
| **Departure Corridor / Gate** | 🔴 **TERMINATED** | Aircraft completes takeoff roll and departs; resources, memory, and PCB deallocated. |
| **ATC Control Tower** | **Short-Term Scheduler** | Selects the next aircraft from Taxiway Alpha to dispatch onto Runway 09L. |
| **Go-Around Preemption** | **Round Robin Preemption** | When an aircraft's allotted time slice (quantum) expires, ATC cycles it back to the taxiway queue to ensure fairness. |

> *Educational Metaphor Disclaimer*: This is an educational analogy for computer science learning, not a real aviation control system.

---

## 🌟 Key Upgrades & Features

- **Top-Down Animated Airport Scene**:
  - Control Tower with animated rotating radar beacon.
  - Active Runway 09L with centerline dashes, threshold piano keys, and glowing active runway boundary.
  - Taxiway Alpha with numbered hold positions (`#1 Threshold`, `#2`, `#3`, `#4`).
  - Holding Apron with weather radar and inspection bays.
  - Aircraft vector sprites that smoothly glide between zones as their process state changes.
- **Manual ATC Dispatcher Command Bar**:
  - Select any flight and issue verified commands:
    - 🛫 **Dispatch to Runway** (`READY → RUNNING`)
    - ⏱️ **Preempt Flight** (`RUNNING → READY`)
    - ⏳ **Request Clearance / Hold** (`RUNNING → WAITING`)
    - 🟢 **Clearance Complete** (`WAITING → READY`)
    - 🏁 **Finish Flight** (`RUNNING → TERMINATED`)
  - Enforces OS transition validity rules (e.g., rejects runway dispatch if runway is already occupied).
- **Synchronized 5-State Process Diagram**:
  - The classic Silberschatz 5-state process diagram runs in real time alongside the airport scene, with illuminating arrows and glowing particles.
- **8-Card Live Dashboard Statistics**:
  - Total Flights Created, Flights in NEW, Flights in READY, Active on Runway [RUNNING], Flights in WAITING, Departed [TERMINATED], Simulation Clock Tick, and Cumulative Valid Transitions.
- **Comprehensive Process & Flight Table**:
  - Flight ID, Aircraft Model, State badge, Arrival Tick, Runway Burst, Remaining Time, Hold Spec, Wait Time, Transition Count, and PCB Inspector.
- **Gantt Chart Timeline & Event Log**:
  - Visual color-coded execution timeline and chronological audit log with dual ATC and OS terminology.
- **Presentation Mode**:
  - One-click projector view that magnifies the airport simulation and state diagram for classroom presentations.

---

## 🚀 How to Run the Project (Zero Dependencies)

This application is built with standard web technologies (HTML5, CSS3, ES6+ JavaScript, SVG). **No Node.js, npm, or backend required!**

### Launch Instructions:
1. Navigate to:
   ```
   c:\Users\ramch\Downloads\os visualization
   ```
2. **Double-click `index.html`** or open with **Google Chrome**, **Microsoft Edge**, or **Firefox**.
3. The visualizer will launch immediately with the **Airport Traffic Control Demo** ready to run!

---

## 🎯 The Airport Demo Preset

Click **"🚀 Load Airport Demo"** on the header to load the classroom presentation scenario:
- **FL-101 (Boeing 737)**: Burst = 5 ticks, requests Weather Hold after 2 ticks (duration = 3 ticks).
- **FL-102 (Airbus A320)**: Burst = 4 ticks, direct takeoff.
- **FL-103 (Boeing 787)**: Burst = 6 ticks, requests Maintenance Hold after 3 ticks (duration = 2 ticks).
- **Scheduler**: Round Robin CPU scheduling with Time Quantum = **2 ticks**.

---

## 📁 Project Structure

```
os-visualization/
├── index.html                   # Semantic HTML5 layout, airport dashboard & modals
├── README.md                    # Project overview, metaphor guide & run instructions
├── css/
│   ├── style.css                # Professional light theme, layout, and responsive grid
│   └── components.css           # Airport animations, aircraft sprites, radar beam & SVG graph
├── js/
│   ├── state-machine.js         # Process/Flight class, 5-state definitions & transition rules
│   ├── simulation.js            # Discrete-event engine, clock, schedulers (RR & FCFS), and metrics
│   ├── airport-scene.js         # Animated top-down Airport Traffic Control SVG visualizer
│   ├── diagram.js               # Synchronized SVG 5-state process transition diagram
│   ├── ui.js                    # DOM rendering, Ready queue, CPU runway slot, table & Gantt chart
│   └── app.js                   # Application bootstrap, ATC manual controls & demo preset
└── docs/
    ├── PRESENTATION_SCRIPT.md   # 2–3 minute speaking script with cues & anticipated Q&A
    ├── SIMULATION_LOGIC.md      # Detailed mathematical breakdown of the simulation & invariants
    └── TESTING_CHECKLIST.md     # Step-by-step test verification checklist for all 6 transitions
```
