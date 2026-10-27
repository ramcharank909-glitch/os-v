/**
 * OS Process State Transition Visualizer
 * Core Process State Machine & Process / Flight Entity
 */

const ProcessState = Object.freeze({
  NEW: 'NEW',
  READY: 'READY',
  RUNNING: 'RUNNING',
  WAITING: 'WAITING',
  TERMINATED: 'TERMINATED'
});

// State definitions with metadata for visualization & educators
const StateMetadata = Object.freeze({
  [ProcessState.NEW]: {
    name: 'New',
    airportName: 'Airspace Arrival Bay',
    color: '#9333ea',
    bg: '#f3e8ff',
    border: '#a855f7',
    description: 'Process created / Plane enters airport airspace & assigned Flight ID.'
  },
  [ProcessState.READY]: {
    name: 'Ready',
    airportName: 'Taxiway Alpha (Runway Queue)',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#3b82f6',
    description: 'Loaded into memory / Aircraft queued on taxiway awaiting runway clearance.'
  },
  [ProcessState.RUNNING]: {
    name: 'Running',
    airportName: 'Active Runway 09L',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#22c55e',
    description: 'Active on CPU core / Aircraft occupying the runway (Strict single occupancy).'
  },
  [ProcessState.WAITING]: {
    name: 'Waiting / Blocked',
    airportName: 'Holding Apron / Weather Hold',
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#f97316',
    description: 'Blocked on I/O / Aircraft held for weather clearance, inspection, or ATC event.'
  },
  [ProcessState.TERMINATED]: {
    name: 'Terminated',
    airportName: 'Departure Corridor / Gate',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#ef4444',
    description: 'Completed execution / Flight departed safely and resources deallocated.'
  }
});

// Valid state machine transitions strictly adhering to Operating System theory
const ValidTransitions = new Set([
  `${ProcessState.NEW}->${ProcessState.READY}`,       // Process admitted / Taxi clearance
  `${ProcessState.READY}->${ProcessState.RUNNING}`,    // Scheduler dispatch / Cleared for takeoff
  `${ProcessState.RUNNING}->${ProcessState.READY}`,    // Time quantum expired / Go-around preemption
  `${ProcessState.RUNNING}->${ProcessState.WAITING}`,  // I/O or event wait / Weather or clearance hold
  `${ProcessState.WAITING}->${ProcessState.READY}`,    // I/O completion / Clearance granted to taxi
  `${ProcessState.RUNNING}->${ProcessState.TERMINATED}`// Process completed / Flight departed
]);

class Process {
  constructor({
    pid,
    flightId = null,
    name = null,
    aircraftType = 'Boeing 737',
    totalCpuBurst,
    ioRequestTick = 0,
    ioDuration = 0,
    arrivalTime = 0,
    color = null
  }) {
    // Flight & Process Identity
    this.pid = (flightId || pid || 'FL-101').toUpperCase();
    this.flightId = this.pid;
    this.aircraftType = aircraftType || 'Commercial Airliner';
    this.name = name || `${this.pid} (${this.aircraftType})`;
    
    // Execution parameters (Runway Burst Time)
    this.totalCpuBurst = Math.max(1, parseInt(totalCpuBurst, 10));
    this.remainingCpuTime = this.totalCpuBurst;
    this.cpuExecutedTicks = 0;
    
    // I/O & Holding Configuration (Weather / Clearance Check)
    this.ioRequestTick = parseInt(ioRequestTick, 10) || 0;
    this.ioDuration = parseInt(ioDuration, 10) || 0;
    this.remainingIoTime = 0;
    this.hasIoRequest = this.ioRequestTick > 0 && this.ioDuration > 0;
    this.ioCompleted = false;

    // State Tracking
    this.state = ProcessState.NEW;
    this.previousState = null;
    this.currentQuantum = 0; // Ticks spent during current CPU/Runway dispatch
    
    // Performance & Lifecycle Metrics
    this.arrivalTime = arrivalTime;
    this.finishTime = null;
    this.waitingTime = 0;      // Total ticks in READY state
    this.totalIoTimeSpent = 0; // Total ticks in WAITING state
    this.transitionCount = 0;  // Count of successful state transitions
    
    // Visual custom accent color or generated from PID
    this.color = color || this.generateColor(this.pid);

    // Historical audit log
    this.history = [];
    this.timeline = []; // State record for every clock tick
    
    // Log creation
    this.recordStateChange(null, ProcessState.NEW, 0, 'Flight registered in ATC airspace [NEW]');
  }

  generateColor(pid) {
    const palette = ['#2563eb', '#7c3aed', '#059669', '#ea580c', '#db2777', '#0891b2', '#4f46e5'];
    const num = parseInt(String(pid).replace(/\D/g, ''), 10) || 1;
    return palette[(num - 1) % palette.length];
  }

  /**
   * Validates and performs state transition
   */
  transitionTo(nextState, tick, reason) {
    if (this.state === nextState) return false;

    const transitionKey = `${this.state}->${nextState}`;
    if (!ValidTransitions.has(transitionKey)) {
      console.error(`Invalid OS transition attempted: ${transitionKey} for ${this.pid}`);
      throw new Error(`Invalid transition: ${this.state} to ${nextState} is not permitted by the OS state machine.`);
    }

    const prevState = this.state;
    this.previousState = prevState;
    this.state = nextState;
    this.transitionCount++;

    // Reset quantum on transition out of or into running
    if (nextState === ProcessState.RUNNING) {
      this.currentQuantum = 0;
    }

    if (nextState === ProcessState.WAITING) {
      this.remainingIoTime = this.ioDuration;
    }

    if (nextState === ProcessState.TERMINATED) {
      this.finishTime = tick;
    }

    this.recordStateChange(prevState, nextState, tick, reason);
    return true;
  }

  recordStateChange(fromState, toState, tick, reason) {
    this.history.push({
      tick,
      fromState,
      toState,
      reason,
      timestamp: new Date().toLocaleTimeString()
    });
  }

  recordTimelineTick(tick) {
    this.timeline[tick] = this.state;
  }

  canRequestIo() {
    return (
      this.hasIoRequest &&
      !this.ioCompleted &&
      this.cpuExecutedTicks === this.ioRequestTick
    );
  }

  isFinished() {
    return this.remainingCpuTime <= 0;
  }

  get turnaroundTime() {
    if (this.finishTime === null) return null;
    return this.finishTime - this.arrivalTime;
  }

  clone() {
    return new Process({
      pid: this.pid,
      flightId: this.flightId,
      name: this.name,
      aircraftType: this.aircraftType,
      totalCpuBurst: this.totalCpuBurst,
      ioRequestTick: this.ioRequestTick,
      ioDuration: this.ioDuration,
      arrivalTime: this.arrivalTime,
      color: this.color
    });
  }
}
