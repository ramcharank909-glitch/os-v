# Airport Traffic Control (ATC) — Testing Checklist

Use this checklist to verify all real-world airport simulation features, state transitions, manual ATC controls, and statistical calculations.

---

## 1. Visual Airport Scene & Layout
- [ ] **Top-Down Airport Scene**: Verify the SVG airport environment renders with:
  - Control Tower with animated rotating radar beacon.
  - Airspace Arrival Bay [NEW].
  - Taxiway Alpha Queue [READY] with `#1 Threshold`, `#2`, `#3`, `#4` hold slots.
  - Active Runway 09L [RUNNING / Single CPU Core] with centerline dashes and threshold stripes.
  - Holding Apron & De-icing Bay [WAITING / Blocked].
  - Departure Corridor & Gates [TERMINATED].
- [ ] **Aircraft Sprites**: Verify aircraft are rendered with top-down vector airframes, wings, tail fins, and rotated flight tags (`FL-101`).
- [ ] **State Diagram Synchronization**: Verify the 5-state process diagram is visible and updates simultaneously with the airport scene.

---

## 2. Dynamic State Transitions & Movement
- [ ] **NEW → READY**: Click "Add Flight" or Reset. Verify aircraft enters Taxiway Alpha queue and arrow `path-admit` flashes purple.
- [ ] **READY → RUNNING (Single Runway Occupancy)**: Click "Step". Verify `FL-101` moves from the head of Taxiway Alpha onto Runway 09L centerline. Verify Runway border glows green.
- [ ] **RUNNING → WAITING (Holding/Weather Event)**: Advance to Tick 2. Verify `FL-101` moves from the runway into Holding Bay H1 for 3 ticks. Verify Runway 09L is freed immediately.
- [ ] **READY → RUNNING (Next Flight Dispatch)**: Verify `FL-102` is immediately cleared onto the runway from the queue.
- [ ] **RUNNING → READY (Preemption / Quantum Expiration)**: Advance to Tick 4. Verify `FL-102`'s 2-tick quantum expires and it returns to the back of Taxiway Alpha (`[FL-103, FL-102]`).
- [ ] **WAITING → READY (Clearance Granted)**: Advance to Tick 5. Verify `FL-101`'s hold timer hits 0 and it returns to Taxiway Alpha.
- [ ] **RUNNING → TERMINATED (Takeoff & Departure)**: Run simulation until an aircraft finishes its burst. Verify it glides off Runway 09L into Departure Gate [TERMINATED].

---

## 3. Manual ATC Dispatcher Controls & Validation
- [ ] **Select Flight Dropdown**: Select `FL-101` from the dropdown. Verify plane is highlighted in the airport scene.
- [ ] **Mutual Exclusion Check**: While a plane is on Runway 09L, select a plane in Ready and click **"Dispatch to Runway"**.
  - [ ] Verify action is rejected with an educational alert: *"Runway 09L is already occupied. Operating systems enforce mutual exclusion on single CPU cores."*
- [ ] **Manual Preempt**: Select the currently running plane and click **"Preempt Flight"**.
  - [ ] Verify plane vacates the runway and rejoins Taxiway Alpha.
- [ ] **Manual Hold**: While a plane is on the runway, click **"Request Clearance / Hold"**.
  - [ ] Verify plane moves to Holding Apron and runway is cleared.
- [ ] **Manual Clearance**: Select a plane in the Holding Apron and click **"Clearance Complete"**.
  - [ ] Verify plane returns to Taxiway Alpha.
- [ ] **Manual Finish**: With a plane on the runway, click **"Finish Flight"**.
  - [ ] Verify plane transitions to Departure Gate [TERMINATED].

---

## 4. Live Dashboard Statistics & Process Table
- [ ] **Total Flights**: Counts all registered flights.
- [ ] **Arrival Bay [NEW]**: Counts incoming flights.
- [ ] **Taxiway [READY]**: Matches number of aircraft on Taxiway Alpha.
- [ ] **Runway 09L [RUNNING]**: Shows active flight ID or "None (Idle)".
- [ ] **Holding [WAITING]**: Matches aircraft in holding bays.
- [ ] **Departed [TERMINATED]**: Matches completed flights.
- [ ] **Simulation Clock**: Accurately shows current tick ($T=N$).
- [ ] **Valid Transitions**: Increments on every successful state change.
- [ ] **Process Table**: Displays Flight ID, Aircraft Model, State badge, Arrival Tick, Burst, Remaining, Wait Time, and Transitions count.

---

## 5. Responsiveness & Presentation Mode
- [ ] **Presentation Mode**: Click "Presentation Mode" $\rightarrow$ verify airport scene and state diagram enlarge for classroom projector view.
- [ ] **Mobile & Laptop Layout**: Resize window $\rightarrow$ verify grid columns reflow smoothly without visual artifacts.
