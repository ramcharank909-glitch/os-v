# Airport Traffic Control (ATC) — Simulation Logic & Operating Systems Specification

## 1. Overview & Educational Metaphor
The **Airport Traffic Control (ATC) Simulator** is an interactive educational model that teaches the fundamental 5-State Operating System Process Lifecycle (Silberschatz & Galvin model) through the real-world analogy of an airport runway system.

### Metaphor Mapping:
| Airport Operation | Operating System Concept | Description |
|:---|:---|:---|
| **Aircraft Flight (`FL-101`)** | **Process (Job / Task)** | An active entity requiring CPU time and system resources. |
| **Active Runway 09L** | **Single CPU Core** | The critical resource. **Strict single occupancy (mutual exclusion)**: only one flight may occupy the runway at a time. |
| **Taxiway Alpha Queue** | **FIFO Ready Queue** | Aircraft cleared for flight, lined up in order awaiting runway access. |
| **Airspace Arrival Bay** | **NEW State** | Aircraft entering terminal airspace; PCB and flight plan data structures allocated. |
| **Holding Apron / De-icing** | **WAITING / Blocked (I/O)** | Aircraft suspended for weather clearance, maintenance, or ATC hold. Cannot use the runway until event completes. |
| **Departure Corridor / Gate** | **TERMINATED State** | Aircraft completes takeoff roll and departs; resources, memory, and PCB deallocated. |
| **ATC Control Tower** | **Short-Term Scheduler** | Selects the next aircraft from Taxiway Alpha to dispatch onto Runway 09L using configured scheduling policy. |
| **Go-Around Preemption** | **Round Robin Preemption** | When an aircraft's allotted time slice (quantum) expires, ATC cycles it back to the taxiway queue to ensure fairness. |

> **Disclaimer**: This is strictly an educational analogy for computer science and operating systems coursework. It does not model real-world aviation flight rules or safety protocols.

---

## 2. Invariants & Correctness Guarantees

1. **Single Runway Occupancy (Mutual Exclusion on CPU)**:
   At most **one** aircraft can be in the `RUNNING` state on Runway 09L at any simulation tick.
2. **State Mutual Exclusion**:
   An aircraft cannot be on the runway (`RUNNING`) and in the holding apron (`WAITING`) simultaneously.
3. **Valid State Transitions**:
   Only the 6 valid transitions defined in OS theory are permitted:
   - `NEW → READY` (Taxiway clearance)
   - `READY → RUNNING` (Runway takeoff clearance)
   - `RUNNING → READY` (Time quantum expired / Go-around preemption)
   - `RUNNING → WAITING` (Weather check / Holding request)
   - `WAITING → READY` (Weather clearance granted / return to taxiway)
   - `RUNNING → TERMINATED` (Takeoff completed / Airspace departure)
4. **Terminated Immutability**:
   Once an aircraft has departed (`TERMINATED`), it can never transition to any other state.
5. **Non-Negative Remaining Time**:
   Remaining execution time decrements only while an aircraft is in `RUNNING` on the runway and is capped at 0.

---

## 3. Manual ATC Dispatcher Validation Rules

Manual controls allow interactive demonstration of transitions while strictly maintaining OS state machine integrity:

- **Dispatch to Runway (`READY → RUNNING`)**:
  - *Precondition 1*: Runway must be free (`runningProcess == null`).
  - *Precondition 2*: Selected flight must be in the `READY` queue.
  - *Rejection*: If the runway is occupied, ATC denies clearance: *"Runway 09L is currently occupied by [PID]. Mutual exclusion: only one aircraft on runway at a time."*
- **Preempt Flight (`RUNNING → READY`)**:
  - *Precondition*: Selected flight must be actively `RUNNING` on the runway.
  - *Action*: Flight vacates runway and joins the back of the Taxiway queue (`readyQueue.push`).
- **Request Clearance / Hold (`RUNNING → WAITING`)**:
  - *Precondition*: Selected flight must be actively `RUNNING`.
  - *Action*: Flight moves to Holding Apron for the specified duration; runway is immediately cleared for another aircraft.
- **Clearance Complete (`WAITING → READY`)**:
  - *Precondition*: Selected flight must be in `WAITING`.
  - *Action*: Flight rejoins Taxiway Alpha queue.
- **Finish Flight (`RUNNING → TERMINATED`)**:
  - *Precondition*: Selected flight must be actively `RUNNING`.
  - *Action*: Flight departs terminal airspace; runway is cleared.

---

## 4. Live Airport Demo Walkthrough (Round Robin, Quantum = 2)

- **FL-101 (Boeing 737)**: Burst = 5 ticks, requests Weather Hold after 2 ticks (duration = 3 ticks).
- **FL-102 (Airbus A320)**: Burst = 4 ticks, direct takeoff.
- **FL-103 (Boeing 787)**: Burst = 6 ticks, requests Maintenance Hold after 3 ticks (duration = 2 ticks).

```
Tick 0:    Admitted FL-101, FL-102, FL-103 into Taxiway Alpha [READY].
Tick 0->1: ATC Tower dispatches FL-101 onto Runway 09L [READY -> RUNNING].
Tick 1->2: FL-101 accelerates on runway (2/5 ticks).
           FL-101 encounters Weather Check! Transitions [RUNNING -> WAITING] (3t hold).
Tick 2->3: Runway free! ATC dispatches next in queue: FL-102 [READY -> RUNNING].
           FL-101 holding in apron (rem: 2t).
Tick 3->4: FL-102 runs 2nd tick (2/4). Time quantum (2t) expires!
           ATC preempts FL-102 back to Taxiway [RUNNING -> READY]. Queue: [FL-103, FL-102].
Tick 4->5: FL-101 weather hold finishes [WAITING -> READY]. Queue: [FL-103, FL-102, FL-101].
           ATC dispatches FL-103 [READY -> RUNNING].
...
All flights systematically finish their bursts and transition to TERMINATED.
```
