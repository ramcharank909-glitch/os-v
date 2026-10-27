/**
 * OS Process State Transition Visualizer
 * Dynamic Simulation Engine, CPU / Runway Scheduler & ATC Controller
 */

class SimulationEngine {
  constructor() {
    this.currentTick = 0;
    this.processes = [];
    this.readyQueue = [];
    this.runningProcess = null;
    this.waitingQueue = [];
    this.terminatedProcesses = [];

    // Scheduling configuration
    this.algorithm = 'RR'; // 'RR' or 'FCFS'
    this.timeQuantum = 2;   // Default 2 ticks for Round Robin

    // Metrics
    this.cpuBusyTicks = 0;
    this.contextSwitches = 0;
    this.totalTransitionsCount = 0; // Total valid state transitions

    // Simulation lifecycle
    this.status = 'STOPPED'; // 'STOPPED', 'RUNNING', 'PAUSED', 'COMPLETED'
    this.timer = null;
    this.speedMs = 1000; // ms per tick

    // Event log
    this.eventLogs = [];
    this.lastNarrative = {
      title: 'Airport ATC Simulation Ready',
      tag: 'INIT',
      text: 'Air Traffic Control Center initialized. Press "Start" or "Step" to manage flight traffic and OS state transitions.',
      subtext: 'Algorithm: Round Robin (Time Quantum = 2 ticks) | Runway: Idle'
    };

    // Callback listeners for UI reactivity
    this.listeners = [];
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notify(eventPayload = {}) {
    this.listeners.forEach(cb => {
      try {
        cb(this, eventPayload);
      } catch (err) {
        console.error('Error in simulation listener:', err);
      }
    });
  }

  setSpeed(speedMs) {
    this.speedMs = Math.max(100, parseInt(speedMs, 10));
    if (this.status === 'RUNNING') {
      this.pause();
      this.start();
    }
  }

  setAlgorithm(algo) {
    if (algo === 'RR' || algo === 'FCFS') {
      this.algorithm = algo;
      this.logEvent(
        'CONFIG',
        `ATC runway scheduling algorithm changed to ${algo === 'RR' ? 'Round Robin (Time Sliced)' : 'First-Come First-Served (FCFS)'}.`
      );
      this.notify();
    }
  }

  setTimeQuantum(quantum) {
    const q = Math.max(1, parseInt(quantum, 10));
    this.timeQuantum = q;
    this.logEvent('CONFIG', `ATC Runway Time Quantum set to ${q} tick(s).`);
    this.notify();
  }

  loadProcesses(processList) {
    this.reset();
    this.processes = processList.map(p => p.clone());
    
    // Initial admission at T=0: All new processes enter the Ready queue
    this.admitNewProcesses();
    this.notify();
  }

  admitNewProcesses() {
    const newlyAdmitted = [];
    this.processes.forEach(proc => {
      if (proc.state === ProcessState.NEW && proc.arrivalTime <= this.currentTick) {
        proc.transitionTo(
          ProcessState.READY,
          this.currentTick,
          'Flight granted taxi clearance into Runway Queue [READY]'
        );
        this.totalTransitionsCount++;
        this.readyQueue.push(proc);
        newlyAdmitted.push(proc.pid);
      }
    });

    if (newlyAdmitted.length > 0) {
      this.logEvent(
        'ADMIT',
        `Flight(s) [${newlyAdmitted.join(', ')}] cleared into Taxiway Alpha (Runway Queue). Transition: NEW → READY.`
      );
    }
  }

  addProcess(proc) {
    this.processes.push(proc);
    if (proc.arrivalTime <= this.currentTick && proc.state === ProcessState.NEW) {
      proc.transitionTo(
        ProcessState.READY,
        this.currentTick,
        'Flight cleared into Runway Queue [READY]'
      );
      this.totalTransitionsCount++;
      this.readyQueue.push(proc);
      this.logEvent(
        'ADMIT',
        `${proc.pid} (${proc.name}) entered airport airspace and joined Taxiway Alpha (Runway Queue).`
      );
    } else {
      this.logEvent(
        'NEW',
        `${proc.pid} (${proc.name}) scheduled in arrival airspace for Tick ${proc.arrivalTime}.`
      );
    }
    this.notify();
  }

  logEvent(tag, description) {
    const entry = {
      tick: this.currentTick,
      tag,
      description,
      timestamp: new Date().toLocaleTimeString()
    };
    this.eventLogs.unshift(entry);
    if (this.eventLogs.length > 150) this.eventLogs.pop();
  }

  /**
   * Main simulation step execution: advances clock by 1 tick
   * Strictly respects Operating System scheduling and state machine rules
   */
  stepTick() {
    if (this.isAllCompleted()) {
      this.status = 'COMPLETED';
      this.lastNarrative = {
        title: 'Airport Operations Complete',
        tag: 'TERMINATE',
        text: 'All flights have finished runway operations and safely departed [TERMINATED].',
        subtext: `Total Ticks: ${this.currentTick} | Runway Utilization: ${this.cpuUtilization}% | Transitions: ${this.totalTransitionsCount}`
      };
      this.pause();
      this.notify({ completed: true });
      return;
    }

    const currentTickBefore = this.currentTick;
    const tickTransitions = [];
    let narrativeText = '';
    let narrativeTag = 'EXEC';
    let narrativeTitle = `Tick ${currentTickBefore} -> ${currentTickBefore + 1}`;

    // Record timeline state for current tick for each process
    this.processes.forEach(p => p.recordTimelineTick(currentTickBefore));

    // STEP 1: Process Waiting / Holding Apron Queue (I/O)
    // Decrement I/O time for all blocked processes
    const completedIoProcesses = [];
    const remainingWaiting = [];

    for (let i = 0; i < this.waitingQueue.length; i++) {
      const proc = this.waitingQueue[i];
      proc.totalIoTimeSpent++;
      proc.remainingIoTime--;

      if (proc.remainingIoTime <= 0) {
        // I/O Completed! Transition: WAITING -> READY
        proc.ioCompleted = true;
        proc.transitionTo(
          ProcessState.READY,
          currentTickBefore + 1,
          'ATC clearance / Weather check resolved. Cleared to taxi.'
        );
        this.totalTransitionsCount++;
        completedIoProcesses.push(proc);
        tickTransitions.push({
          from: ProcessState.WAITING,
          to: ProcessState.READY,
          pid: proc.pid,
          name: proc.name,
          reason: 'Clearance completed'
        });
        this.logEvent('IO_DONE', `${proc.pid} completed weather/clearance hold. Returned from WAITING to READY.`);
      } else {
        remainingWaiting.push(proc);
      }
    }
    this.waitingQueue = remainingWaiting;

    // Append processes that finished I/O to the Ready queue
    completedIoProcesses.forEach(proc => {
      this.readyQueue.push(proc);
    });

    // STEP 2: CPU Scheduler Dispatch
    // If no process is currently on the CPU, dispatch next available from Ready queue
    let justDispatched = false;
    if (!this.runningProcess && this.readyQueue.length > 0) {
      const nextProc = this.readyQueue.shift();
      nextProc.transitionTo(
        ProcessState.RUNNING,
        currentTickBefore,
        `ATC scheduler assigned Active Runway 09L (${this.algorithm})`
      );
      this.totalTransitionsCount++;
      this.runningProcess = nextProc;
      this.contextSwitches++;
      justDispatched = true;

      tickTransitions.push({
        from: ProcessState.READY,
        to: ProcessState.RUNNING,
        pid: nextProc.pid,
        name: nextProc.name,
        reason: 'Runway assigned'
      });
      this.logEvent('SCHEDULER', `ATC cleared ${nextProc.pid} onto Active Runway 09L (${this.algorithm}). Transition: READY → RUNNING.`);
    }

    // STEP 3: Execute Running Process on Runway (CPU)
    let cpuWasActive = false;
    let runningAction = null;

    if (this.runningProcess) {
      cpuWasActive = true;
      this.cpuBusyTicks++;
      const proc = this.runningProcess;
      proc.cpuExecutedTicks++;
      // Decrease remaining execution time only while running, never allow negative
      proc.remainingCpuTime = Math.max(0, proc.remainingCpuTime - 1);
      proc.currentQuantum++;

      this.logEvent(
        'EXEC',
        `${proc.pid} accelerating on Runway 09L (Progress: ${proc.cpuExecutedTicks}/${proc.totalCpuBurst} ticks, Time Slice: ${proc.currentQuantum}/${this.timeQuantum}).`
      );

      // Check condition A: Has the process completed all CPU bursts?
      if (proc.isFinished()) {
        proc.transitionTo(
          ProcessState.TERMINATED,
          currentTickBefore + 1,
          'Flight completed takeoff run and departed terminal airspace'
        );
        this.totalTransitionsCount++;
        this.terminatedProcesses.push(proc);
        tickTransitions.push({
          from: ProcessState.RUNNING,
          to: ProcessState.TERMINATED,
          pid: proc.pid,
          name: proc.name,
          reason: 'Flight departed'
        });
        this.logEvent('TERMINATE', `${proc.pid} finished takeoff roll and departed safely. Transition: RUNNING → TERMINATED.`);
        runningAction = 'TERMINATED';
        narrativeTag = 'TERMINATE';
        narrativeText = `${proc.pid} completed all runway execution (${proc.totalCpuBurst} ticks). ATC cleared it for climb; process terminated and runway is clear.`;
        this.runningProcess = null;
      }
      // Check condition B: Does the process request I/O at this exact execution point?
      else if (proc.canRequestIo()) {
        proc.transitionTo(
          ProcessState.WAITING,
          currentTickBefore + 1,
          `Flight held for weather check / clearance at tick ${proc.cpuExecutedTicks}`
        );
        this.totalTransitionsCount++;
        this.waitingQueue.push(proc);
        tickTransitions.push({
          from: ProcessState.RUNNING,
          to: ProcessState.WAITING,
          pid: proc.pid,
          name: proc.name,
          reason: 'Holding for clearance'
        });
        this.logEvent(
          'IO_REQ',
          `${proc.pid} requested ATC clearance / weather check after ${proc.cpuExecutedTicks} ticks. Moved RUNNING → WAITING (Holding: ${proc.ioDuration} ticks).`
        );
        runningAction = 'IO_REQUEST';
        narrativeTag = 'IO_REQ';
        narrativeText = `${proc.pid} issued an I/O request (weather/clearance check). The OS vacated the CPU (runway) and placed ${proc.pid} in the WAITING holding apron for ${proc.ioDuration} ticks.`;
        this.runningProcess = null;
      }
      // Check condition C: Round Robin Time Quantum Expired?
      else if (this.algorithm === 'RR' && proc.currentQuantum >= this.timeQuantum) {
        // Preemption
        proc.transitionTo(
          ProcessState.READY,
          currentTickBefore + 1,
          `Runway time slice (${this.timeQuantum} ticks) expired; go-around to taxiway queue`
        );
        this.totalTransitionsCount++;
        this.readyQueue.push(proc);
        tickTransitions.push({
          from: ProcessState.RUNNING,
          to: ProcessState.READY,
          pid: proc.pid,
          name: proc.name,
          reason: 'Time quantum expired'
        });
        this.logEvent(
          'PREEMPT',
          `Time quantum (${this.timeQuantum} ticks) expired for ${proc.pid}. Preempted and returned to Taxiway Alpha (Ready queue).`
        );
        runningAction = 'PREEMPTED';
        narrativeTag = 'PREEMPT';
        narrativeText = `${proc.pid} occupied the runway for its allocated time slice (${this.timeQuantum} ticks). The ATC scheduler preempted ${proc.pid} back to the Ready taxiway queue to share the runway with other waiting flights.`;
        this.runningProcess = null;
      }
      // Condition D: Process continues on CPU for next tick
      else {
        runningAction = 'CONTINUING';
        narrativeTag = 'EXEC';
        narrativeText = `${proc.pid} is actively rolling on Runway 09L (${proc.cpuExecutedTicks}/${proc.totalCpuBurst} ticks). Remaining: ${proc.remainingCpuTime} ticks.`;
      }
    } else {
      narrativeTag = 'IDLE';
      narrativeText = 'Runway 09L (CPU Core) is IDLE — no aircraft currently queued on Taxiway Alpha.';
      this.logEvent('IDLE', 'Runway 09L is IDLE (Ready queue is empty).');
    }

    // STEP 4: Increment waiting time for all processes remaining in the Ready queue
    this.readyQueue.forEach(proc => {
      proc.waitingTime++;
    });

    // STEP 5: Advance clock
    this.currentTick++;

    // Format Narrative summary for student / educator display
    if (completedIoProcesses.length > 0) {
      const ioText = `Clearance granted for [${completedIoProcesses.map(p => p.pid).join(', ')}], returning them to the Taxiway Ready queue.`;
      narrativeText = `${narrativeText} Meanwhile, ${ioText}`;
    }

    this.lastNarrative = {
      title: narrativeTitle,
      tag: narrativeTag,
      text: narrativeText,
      subtext: `Ready Queue: [${this.readyQueue.map(p => p.pid).join(', ') || 'Empty'}] | Runway: ${this.runningProcess ? this.runningProcess.pid : 'Idle'}`
    };

    // Notify UI listeners with transitions that occurred
    this.notify({
      transitions: tickTransitions,
      cpuActive: cpuWasActive,
      action: runningAction
    });

    if (this.isAllCompleted()) {
      this.status = 'COMPLETED';
      this.pause();
    }
  }

  // ==========================================
  // MANUAL ATC & OS EVENT CONTROLS
  // Strictly validated against OS State Machine
  // ==========================================

  /**
   * Manual Command: Dispatch flight from READY to RUNNING
   */
  manualDispatch(flightId) {
    if (this.runningProcess) {
      return {
        success: false,
        error: `Runway 09L is already occupied by ${this.runningProcess.pid}. Operating Systems enforce mutual exclusion: only ONE process may occupy the CPU runway at a time.`
      };
    }

    const idx = this.readyQueue.findIndex(p => p.pid === flightId);
    if (idx === -1) {
      return {
        success: false,
        error: `Flight ${flightId} is not in the READY queue. An aircraft must be in READY to be dispatched to RUNNING.`
      };
    }

    const proc = this.readyQueue.splice(idx, 1)[0];
    proc.transitionTo(
      ProcessState.RUNNING,
      this.currentTick,
      'ATC manual instruction: Cleared for Runway 09L [READY → RUNNING]'
    );
    this.totalTransitionsCount++;
    this.runningProcess = proc;
    this.contextSwitches++;

    this.logEvent('SCHEDULER', `Manual Dispatch: ${proc.pid} assigned Runway 09L. Transition: READY → RUNNING.`);
    this.notify({
      transitions: [{ from: ProcessState.READY, to: ProcessState.RUNNING, pid: proc.pid, name: proc.name, reason: 'Manual dispatch' }]
    });

    return { success: true, message: `Dispatched ${proc.pid} to Runway 09L [RUNNING].` };
  }

  /**
   * Manual Command: Preempt running flight back to READY
   */
  manualPreempt(flightId) {
    if (!this.runningProcess || this.runningProcess.pid !== flightId) {
      return {
        success: false,
        error: `Flight ${flightId} is not currently RUNNING on the runway. Only the active process can be preempted.`
      };
    }

    const proc = this.runningProcess;
    proc.transitionTo(
      ProcessState.READY,
      this.currentTick,
      'ATC manual instruction: Preempted to Taxiway Alpha [RUNNING → READY]'
    );
    this.totalTransitionsCount++;
    this.readyQueue.push(proc);
    this.runningProcess = null;

    this.logEvent('PREEMPT', `Manual Preempt: ${proc.pid} vacated Runway 09L to Taxiway Alpha. Transition: RUNNING → READY.`);
    this.notify({
      transitions: [{ from: ProcessState.RUNNING, to: ProcessState.READY, pid: proc.pid, name: proc.name, reason: 'Manual preemption' }]
    });

    return { success: true, message: `Preempted ${proc.pid} back to Ready queue [READY].` };
  }

  /**
   * Manual Command: Move running flight to WAITING (I/O event)
   */
  manualRequestWait(flightId, duration = 3, reason = 'Holding for weather clearance') {
    if (!this.runningProcess || this.runningProcess.pid !== flightId) {
      return {
        success: false,
        error: `Flight ${flightId} is not currently RUNNING on the runway. Only a running process can issue an I/O or wait request.`
      };
    }

    const proc = this.runningProcess;
    proc.ioDuration = Math.max(1, parseInt(duration, 10));
    proc.remainingIoTime = proc.ioDuration;
    proc.hasIoRequest = true;

    proc.transitionTo(
      ProcessState.WAITING,
      this.currentTick,
      `ATC manual instruction: ${reason} [RUNNING → WAITING]`
    );
    this.totalTransitionsCount++;
    this.waitingQueue.push(proc);
    this.runningProcess = null;

    this.logEvent('IO_REQ', `Manual Wait: ${proc.pid} moved to Holding Apron (${proc.ioDuration} ticks). Transition: RUNNING → WAITING.`);
    this.notify({
      transitions: [{ from: ProcessState.RUNNING, to: ProcessState.WAITING, pid: proc.pid, name: proc.name, reason: 'Manual hold request' }]
    });

    return { success: true, message: `Moved ${proc.pid} to Holding Apron [WAITING] for ${proc.ioDuration} ticks.` };
  }

  /**
   * Manual Command: Complete waiting event and move back to READY
   */
  manualCompleteWait(flightId) {
    const idx = this.waitingQueue.findIndex(p => p.pid === flightId);
    if (idx === -1) {
      return {
        success: false,
        error: `Flight ${flightId} is not in the WAITING holding apron.`
      };
    }

    const proc = this.waitingQueue.splice(idx, 1)[0];
    proc.ioCompleted = true;
    proc.remainingIoTime = 0;

    proc.transitionTo(
      ProcessState.READY,
      this.currentTick,
      'ATC manual instruction: Clearance granted. Returned to Taxiway [WAITING → READY]'
    );
    this.totalTransitionsCount++;
    this.readyQueue.push(proc);

    this.logEvent('IO_DONE', `Manual Event Complete: ${proc.pid} cleared from holding area to Ready queue. Transition: WAITING → READY.`);
    this.notify({
      transitions: [{ from: ProcessState.WAITING, to: ProcessState.READY, pid: proc.pid, name: proc.name, reason: 'Manual clearance granted' }]
    });

    return { success: true, message: `Cleared ${proc.pid} from Waiting back to Ready queue [READY].` };
  }

  /**
   * Manual Command: Finish and terminate running flight
   */
  manualFinish(flightId) {
    if (!this.runningProcess || this.runningProcess.pid !== flightId) {
      return {
        success: false,
        error: `Flight ${flightId} is not currently RUNNING. Only a running process can transition to Terminated.`
      };
    }

    const proc = this.runningProcess;
    proc.remainingCpuTime = 0;

    proc.transitionTo(
      ProcessState.TERMINATED,
      this.currentTick,
      'ATC manual instruction: Takeoff completed; departed airspace [RUNNING → TERMINATED]'
    );
    this.totalTransitionsCount++;
    this.terminatedProcesses.push(proc);
    this.runningProcess = null;

    this.logEvent('TERMINATE', `Manual Finish: ${proc.pid} completed flight operations and departed. Transition: RUNNING → TERMINATED.`);
    this.notify({
      transitions: [{ from: ProcessState.RUNNING, to: ProcessState.TERMINATED, pid: proc.pid, name: proc.name, reason: 'Manual flight finish' }]
    });

    return { success: true, message: `Flight ${proc.pid} completed takeoff and departed [TERMINATED].` };
  }

  // ==========================================
  // PLAYBACK & PRESETS
  // ==========================================

  start() {
    if (this.status === 'RUNNING') return;
    if (this.isAllCompleted()) {
      this.reset();
    }
    this.status = 'RUNNING';
    this.timer = setInterval(() => {
      this.stepTick();
    }, this.speedMs);
    this.notify();
  }

  pause() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.status === 'RUNNING') {
      this.status = 'PAUSED';
    }
    this.notify();
  }

  reset() {
    this.pause();
    this.currentTick = 0;
    this.cpuBusyTicks = 0;
    this.contextSwitches = 0;
    this.totalTransitionsCount = 0;
    this.readyQueue = [];
    this.runningProcess = null;
    this.waitingQueue = [];
    this.terminatedProcesses = [];
    this.eventLogs = [];
    this.status = 'STOPPED';

    // Clone all processes fresh to reset all metrics and states
    this.processes = this.processes.map(p => {
      return new Process({
        pid: p.pid,
        flightId: p.flightId,
        name: p.name,
        aircraftType: p.aircraftType,
        totalCpuBurst: p.totalCpuBurst,
        ioRequestTick: p.ioRequestTick,
        ioDuration: p.ioDuration,
        arrivalTime: p.arrivalTime,
        color: p.color
      });
    });

    this.lastNarrative = {
      title: 'Simulation Reset',
      tag: 'INIT',
      text: 'Airport Traffic Control simulation reset to Tick 0. All flights re-initialized.',
      subtext: 'Ready to start simulation.'
    };

    // Re-admit processes that arrive at tick 0
    this.admitNewProcesses();
    this.notify();
  }

  isAllCompleted() {
    return (
      this.processes.length > 0 &&
      this.processes.every(p => p.state === ProcessState.TERMINATED)
    );
  }

  // Calculated Metrics
  get cpuUtilization() {
    if (this.currentTick === 0) return '0.0';
    return ((this.cpuBusyTicks / this.currentTick) * 100).toFixed(1);
  }

  get averageWaitingTime() {
    if (this.processes.length === 0) return '0.0';
    const totalWait = this.processes.reduce((acc, p) => acc + p.waitingTime, 0);
    return (totalWait / this.processes.length).toFixed(1);
  }

  get averageTurnaroundTime() {
    const completed = this.processes.filter(p => p.finishTime !== null);
    if (completed.length === 0) return '0.0';
    const totalTAT = completed.reduce((acc, p) => acc + (p.finishTime - p.arrivalTime), 0);
    return (totalTAT / completed.length).toFixed(1);
  }

  getStateCounts() {
    const counts = {
      [ProcessState.NEW]: 0,
      [ProcessState.READY]: 0,
      [ProcessState.RUNNING]: 0,
      [ProcessState.WAITING]: 0,
      [ProcessState.TERMINATED]: 0
    };

    this.processes.forEach(p => {
      if (counts[p.state] !== undefined) {
        counts[p.state]++;
      }
    });

    return counts;
  }

  getDashboardStats() {
    const counts = this.getStateCounts();
    return {
      totalFlights: this.processes.length,
      flightsNew: counts[ProcessState.NEW],
      flightsReady: counts[ProcessState.READY],
      flightsRunning: counts[ProcessState.RUNNING],
      flightsWaiting: counts[ProcessState.WAITING],
      flightsTerminated: counts[ProcessState.TERMINATED],
      currentTick: this.currentTick,
      successfulTransitions: this.totalTransitionsCount,
      cpuUtilization: this.cpuUtilization
    };
  }
}
