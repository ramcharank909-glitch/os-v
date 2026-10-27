/**
 * OS Process State Transition Visualizer
 * Main Application Bootstrap & Event Handlers
 */

class App {
  constructor() {
    this.sim = new SimulationEngine();
    this.diagram = new StateDiagram('state-diagram-svg');
    this.airportScene = new AirportScene('airport-scene-svg');
    this.ui = new UIController(this.sim, this.diagram, this.airportScene);

    this.init();
  }

  init() {
    // Connect simulation events to UI updates
    this.sim.onUpdate((engine, payload) => {
      this.ui.render(payload);
    });

    this.bindControls();
    this.bindManualAtcControls();
    this.bindModals();
    this.bindEducationalAccordion();

    // Automatically load the Airport Demo as the initial scenario
    this.loadAirportDemo();
  }

  bindControls() {
    // Play / Pause
    const btnPlay = document.getElementById('btn-play');
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        if (this.sim.status === 'RUNNING') {
          this.sim.pause();
        } else {
          this.sim.start();
        }
      });
    }

    // Step Forward (1 Tick)
    const btnStep = document.getElementById('btn-step');
    if (btnStep) {
      btnStep.addEventListener('click', () => {
        if (this.sim.status === 'RUNNING') {
          this.sim.pause();
        }
        this.sim.stepTick();
      });
    }

    // Reset
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.sim.reset();
        this.ui.showToast('Simulation reset to initial state (Tick 0).', 'info');
      });
    }

    // Load Airport Demo Button
    const btnAirportDemo = document.getElementById('btn-airport-demo');
    if (btnAirportDemo) {
      btnAirportDemo.addEventListener('click', () => {
        this.loadAirportDemo();
        this.ui.showToast('Loaded Airport Traffic Control demo scenario (FL-101, FL-102, FL-103).', 'success');
      });
    }

    // Speed Slider
    const speedSlider = document.getElementById('speed-slider');
    const speedLabel = document.getElementById('speed-label');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.sim.setSpeed(val);
        if (speedLabel) {
          speedLabel.textContent = `${(val / 1000).toFixed(1)}s/t`;
        }
      });
    }

    // Algorithm Selector
    const algoSelect = document.getElementById('algo-select');
    if (algoSelect) {
      algoSelect.addEventListener('change', (e) => {
        this.sim.setAlgorithm(e.target.value);
      });
    }

    // Quantum Stepper
    const quantumInput = document.getElementById('quantum-input');
    if (quantumInput) {
      quantumInput.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        if (val >= 1) {
          this.sim.setTimeQuantum(val);
        } else {
          e.target.value = 1;
          this.sim.setTimeQuantum(1);
        }
      });
    }

    // Presentation Mode Toggle
    const btnPresMode = document.getElementById('btn-presentation-mode');
    if (btnPresMode) {
      btnPresMode.addEventListener('click', () => {
        this.togglePresentationMode();
      });
    }

    // Clear Logs Button
    const btnClearLogs = document.getElementById('btn-clear-logs');
    if (btnClearLogs) {
      btnClearLogs.addEventListener('click', () => {
        this.sim.eventLogs = [];
        this.ui.updateEventLog();
        this.ui.showToast('Airport event logs cleared.', 'info');
      });
    }
  }

  /**
   * Binds Manual ATC Dispatcher & OS Event Controls
   * Strictly validated against OS State Machine
   */
  bindManualAtcControls() {
    const getSelectedFlight = () => {
      const select = document.getElementById('select-manual-flight');
      return select ? select.value : null;
    };

    // 1. Dispatch to Runway [READY -> RUNNING]
    const btnDispatch = document.getElementById('btn-manual-dispatch');
    if (btnDispatch) {
      btnDispatch.addEventListener('click', () => {
        const flightId = getSelectedFlight();
        if (!flightId) {
          this.ui.showToast('Please select a flight first.', 'warning');
          return;
        }
        const res = this.sim.manualDispatch(flightId);
        if (res.success) {
          this.ui.showToast(res.message, 'success');
        } else {
          this.ui.showToast(res.error, 'error');
        }
      });
    }

    // 2. Preempt Process [RUNNING -> READY]
    const btnPreempt = document.getElementById('btn-manual-preempt');
    if (btnPreempt) {
      btnPreempt.addEventListener('click', () => {
        const flightId = getSelectedFlight();
        if (!flightId) {
          this.ui.showToast('Please select a flight first.', 'warning');
          return;
        }
        const res = this.sim.manualPreempt(flightId);
        if (res.success) {
          this.ui.showToast(res.message, 'success');
        } else {
          this.ui.showToast(res.error, 'error');
        }
      });
    }

    // 3. Request Clearance / Wait [RUNNING -> WAITING]
    const btnWait = document.getElementById('btn-manual-wait');
    if (btnWait) {
      btnWait.addEventListener('click', () => {
        const flightId = getSelectedFlight();
        if (!flightId) {
          this.ui.showToast('Please select a flight first.', 'warning');
          return;
        }
        const res = this.sim.manualRequestWait(flightId, 3, 'Holding for weather clearance');
        if (res.success) {
          this.ui.showToast(res.message, 'success');
        } else {
          this.ui.showToast(res.error, 'error');
        }
      });
    }

    // 4. Complete Waiting Event [WAITING -> READY]
    const btnCompleteWait = document.getElementById('btn-manual-complete-wait');
    if (btnCompleteWait) {
      btnCompleteWait.addEventListener('click', () => {
        const flightId = getSelectedFlight();
        if (!flightId) {
          this.ui.showToast('Please select a flight first.', 'warning');
          return;
        }
        const res = this.sim.manualCompleteWait(flightId);
        if (res.success) {
          this.ui.showToast(res.message, 'success');
        } else {
          this.ui.showToast(res.error, 'error');
        }
      });
    }

    // 5. Finish Flight [RUNNING -> TERMINATED]
    const btnFinish = document.getElementById('btn-manual-finish');
    if (btnFinish) {
      btnFinish.addEventListener('click', () => {
        const flightId = getSelectedFlight();
        if (!flightId) {
          this.ui.showToast('Please select a flight first.', 'warning');
          return;
        }
        const res = this.sim.manualFinish(flightId);
        if (res.success) {
          this.ui.showToast(res.message, 'success');
        } else {
          this.ui.showToast(res.error, 'error');
        }
      });
    }

    // Flight select dropdown change
    const select = document.getElementById('select-manual-flight');
    if (select) {
      select.addEventListener('change', (e) => {
        this.selectFlight(e.target.value);
      });
    }
  }

  /**
   * Selects flight across the entire interface (SVG Scene, Dropdown, Table)
   */
  selectFlight(flightId) {
    if (!flightId) return;
    if (this.airportScene) {
      this.airportScene.selectedFlightId = flightId;
      this.airportScene.update(this.sim);
    }
    const select = document.getElementById('select-manual-flight');
    if (select && select.value !== flightId) {
      select.value = flightId;
    }
  }

  /**
   * Loads the standard Airport Traffic Control Demo scenario:
   * 3 flights arriving:
   * - FL-101 (Boeing 737): Burst = 5 ticks, Weather hold at 2 for 3 ticks.
   * - FL-102 (Airbus A320): Burst = 4 ticks, direct takeoff.
   * - FL-103 (Boeing 787): Burst = 6 ticks, Maintenance hold at 3 for 2 ticks.
   * Round Robin scheduling, Quantum = 2 ticks.
   */
  loadAirportDemo() {
    this.sim.setAlgorithm('RR');
    this.sim.setTimeQuantum(2);

    const algoSelect = document.getElementById('algo-select');
    if (algoSelect) algoSelect.value = 'RR';

    const quantumInput = document.getElementById('quantum-input');
    if (quantumInput) quantumInput.value = '2';

    const fl101 = new Process({
      pid: 'FL-101',
      flightId: 'FL-101',
      name: 'SkyAir 101',
      aircraftType: 'Boeing 737',
      totalCpuBurst: 5,
      ioRequestTick: 2,
      ioDuration: 3,
      arrivalTime: 0,
      color: '#2563eb' // Blue
    });

    const fl102 = new Process({
      pid: 'FL-102',
      flightId: 'FL-102',
      name: 'AeroJet 102',
      aircraftType: 'Airbus A320',
      totalCpuBurst: 4,
      ioRequestTick: 0,
      ioDuration: 0,
      arrivalTime: 0,
      color: '#10b981' // Green
    });

    const fl103 = new Process({
      pid: 'FL-103',
      flightId: 'FL-103',
      name: 'GlobalAir 103',
      aircraftType: 'Boeing 787',
      totalCpuBurst: 6,
      ioRequestTick: 3,
      ioDuration: 2,
      arrivalTime: 0,
      color: '#8b5cf6' // Purple
    });

    this.sim.loadProcesses([fl101, fl102, fl103]);

    this.sim.lastNarrative = {
      title: 'Airport Traffic Control Initialized',
      tag: 'INIT',
      text: 'Loaded 3 flights: FL-101 (Burst 5, Weather Hold at 2), FL-102 (Burst 4), FL-103 (Burst 6, Maintenance at 3). Ready to simulate process scheduling.',
      subtext: 'Algorithm: Round Robin | Time Quantum: 2 ticks | Runway: Idle'
    };

    this.selectFlight('FL-101');
    this.ui.render();
  }

  bindModals() {
    // Add Flight Modal
    const btnOpenAdd = document.getElementById('btn-open-add-process');
    const modalAdd = document.getElementById('modal-add-process');
    const btnCloseAdd = document.getElementById('btn-close-add-modal');
    const btnCancelAdd = document.getElementById('btn-cancel-add');
    const formAdd = document.getElementById('form-add-process');
    const checkHasIo = document.getElementById('input-has-io');
    const ioFields = document.getElementById('io-optional-fields');

    if (btnOpenAdd && modalAdd) {
      btnOpenAdd.addEventListener('click', () => {
        this.resetAddForm();
        this.ui.showModal(modalAdd);
      });
    }

    if (btnCloseAdd && modalAdd) {
      btnCloseAdd.addEventListener('click', () => this.ui.hideModal(modalAdd));
    }
    if (btnCancelAdd && modalAdd) {
      btnCancelAdd.addEventListener('click', () => this.ui.hideModal(modalAdd));
    }

    if (checkHasIo && ioFields) {
      checkHasIo.addEventListener('change', (e) => {
        ioFields.style.display = e.target.checked ? 'block' : 'none';
      });
    }

    if (formAdd) {
      formAdd.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddProcessSubmit();
      });
    }

    // Educational Guide Modal
    const btnOpenEdu = document.getElementById('btn-open-edu');
    const modalEdu = document.getElementById('modal-edu');
    const btnCloseEdu = document.getElementById('btn-close-edu');

    if (btnOpenEdu && modalEdu) {
      btnOpenEdu.addEventListener('click', () => this.ui.showModal(modalEdu));
    }
    if (btnCloseEdu && modalEdu) {
      btnCloseEdu.addEventListener('click', () => this.ui.hideModal(modalEdu));
    }

    // Demo Script Modal
    const btnOpenScript = document.getElementById('btn-open-script');
    const modalScript = document.getElementById('modal-script');
    const btnCloseScript = document.getElementById('btn-close-script');

    if (btnOpenScript && modalScript) {
      btnOpenScript.addEventListener('click', () => this.ui.showModal(modalScript));
    }
    if (btnCloseScript && modalScript) {
      btnCloseScript.addEventListener('click', () => this.ui.hideModal(modalScript));
    }

    // Process Detail Modal
    const modalDetail = document.getElementById('modal-process-detail');
    const btnCloseDetail = document.getElementById('btn-close-detail');
    if (btnCloseDetail && modalDetail) {
      btnCloseDetail.addEventListener('click', () => this.ui.hideModal(modalDetail));
    }

    // Close modals on overlay backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.ui.hideModal(overlay);
        }
      });
    });
  }

  resetAddForm() {
    const nextNum = 101 + this.sim.processes.length;
    const nextPid = `FL-${nextNum}`;
    const pidInput = document.getElementById('input-proc-pid');
    const nameInput = document.getElementById('input-proc-name');
    const burstInput = document.getElementById('input-proc-burst');
    const checkHasIo = document.getElementById('input-has-io');
    const ioReqInput = document.getElementById('input-proc-io-req');
    const ioDurInput = document.getElementById('input-proc-io-dur');
    const errBox = document.getElementById('add-process-error');

    if (pidInput) pidInput.value = nextPid;
    if (nameInput) nameInput.value = `AeroFlight ${nextNum} (Boeing 737)`;
    if (burstInput) burstInput.value = '5';
    if (checkHasIo) checkHasIo.checked = false;
    if (ioReqInput) ioReqInput.value = '2';
    if (ioDurInput) ioDurInput.value = '2';
    if (errBox) {
      errBox.style.display = 'none';
      errBox.textContent = '';
    }

    const ioFields = document.getElementById('io-optional-fields');
    if (ioFields) ioFields.style.display = 'none';
  }

  handleAddProcessSubmit() {
    const pid = document.getElementById('input-proc-pid').value.trim().toUpperCase();
    const name = document.getElementById('input-proc-name').value.trim();
    const burst = parseInt(document.getElementById('input-proc-burst').value, 10);
    const hasIo = document.getElementById('input-has-io').checked;
    const ioReq = hasIo ? parseInt(document.getElementById('input-proc-io-req').value, 10) : 0;
    const ioDur = hasIo ? parseInt(document.getElementById('input-proc-io-dur').value, 10) : 0;

    // Validation
    if (!pid || !name) {
      this.showAddError('Flight ID and Name cannot be empty.');
      return;
    }

    if (isNaN(burst) || burst <= 0) {
      this.showAddError('Runway Burst must be a positive integer greater than 0.');
      return;
    }

    if (burst > 30) {
      this.showAddError('Runway Burst cannot exceed 30 ticks for presentation clarity.');
      return;
    }

    if (hasIo) {
      if (isNaN(ioReq) || ioReq <= 0 || ioReq >= burst) {
        this.showAddError(`Holding/Weather check point must be between 1 and ${burst - 1} ticks.`);
        return;
      }
      if (isNaN(ioDur) || ioDur <= 0) {
        this.showAddError('Holding duration must be a positive integer.');
        return;
      }
    }

    // Check if Flight ID already exists
    const exists = this.sim.processes.some(p => p.pid.toUpperCase() === pid);
    if (exists) {
      this.showAddError(`A flight with ID "${pid}" already exists in the system.`);
      return;
    }

    // Add new flight
    const newProc = new Process({
      pid,
      flightId: pid,
      name,
      aircraftType: name,
      totalCpuBurst: burst,
      ioRequestTick: hasIo ? ioReq : 0,
      ioDuration: hasIo ? ioDur : 0,
      arrivalTime: this.sim.currentTick
    });

    this.sim.addProcess(newProc);
    this.selectFlight(pid);
    this.ui.hideModal(document.getElementById('modal-add-process'));
    this.ui.showToast(`Flight ${pid} added and cleared into Taxiway Alpha queue.`, 'success');
  }

  showAddError(msg) {
    const errBox = document.getElementById('add-process-error');
    if (errBox) {
      errBox.textContent = msg;
      errBox.style.display = 'block';
    }
  }

  showProcessDetail(pid) {
    const proc = this.sim.processes.find(p => p.pid === pid);
    if (!proc) return;

    const modal = document.getElementById('modal-process-detail');
    const titleEl = document.getElementById('detail-proc-title');
    const pcbGrid = document.getElementById('detail-pcb-grid');
    const historyList = document.getElementById('detail-history-list');

    if (titleEl) {
      titleEl.innerHTML = `
        <span class="proc-pid-pill" style="background: ${proc.color}; color: white;">${proc.pid}</span>
        <span>Flight Control Block (PCB) — ${proc.name}</span>
      `;
    }

    if (pcbGrid) {
      pcbGrid.innerHTML = `
        <div class="pcb-field">
          <span class="pcb-label">Flight ID</span>
          <span class="pcb-value">${proc.pid}</span>
        </div>
        <div class="pcb-field">
          <span class="pcb-label">Current State</span>
          <span class="pcb-value"><span class="badge-count badge-state-${proc.state}">${proc.state}</span></span>
        </div>
        <div class="pcb-field">
          <span class="pcb-label">Total Runway Burst</span>
          <span class="pcb-value">${proc.totalCpuBurst} ticks</span>
        </div>
        <div class="pcb-field">
          <span class="pcb-label">Executed Runway Ticks</span>
          <span class="pcb-value">${proc.cpuExecutedTicks} ticks</span>
        </div>
        <div class="pcb-field">
          <span class="pcb-label">Remaining Runway Time</span>
          <span class="pcb-value">${proc.remainingCpuTime} ticks</span>
        </div>
        <div class="pcb-field">
          <span class="pcb-label">Taxiway Waiting Time</span>
          <span class="pcb-value">${proc.waitingTime} ticks</span>
        </div>
        <div class="pcb-field">
          <span class="pcb-label">Holding / Weather Hold</span>
          <span class="pcb-value">${proc.hasIoRequest ? `After ${proc.ioRequestTick}t (for ${proc.ioDuration}t)` : 'Direct Runway'}</span>
        </div>
        <div class="pcb-field">
          <span class="pcb-label">State Transitions</span>
          <span class="pcb-value">${proc.transitionCount} transitions</span>
        </div>
      `;
    }

    if (historyList) {
      if (proc.history.length === 0) {
        historyList.innerHTML = '<div style="color: #94a3b8;">No state changes recorded.</div>';
      } else {
        historyList.innerHTML = proc.history.map(item => `
          <div class="history-item">
            <span class="history-tick">T=${item.tick}</span>
            <span class="badge-count badge-state-${item.fromState || 'NEW'}">${item.fromState || 'NONE'}</span>
            <span class="history-arrow">→</span>
            <span class="badge-count badge-state-${item.toState}">${item.toState}</span>
            <span style="color: #475569; font-size: 0.8rem; margin-left: auto;">${item.reason}</span>
          </div>
        `).join('');
      }
    }

    this.ui.showModal(modal);
  }

  showStateExplanation(stateKey) {
    const modalEdu = document.getElementById('modal-edu');
    this.ui.showModal(modalEdu);

    const accItem = document.getElementById(`edu-item-${stateKey.toLowerCase()}`);
    if (accItem) {
      document.querySelectorAll('.edu-item').forEach(el => el.classList.remove('open'));
      accItem.classList.add('open');
      accItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  bindEducationalAccordion() {
    const items = document.querySelectorAll('.edu-item');
    items.forEach(item => {
      const header = item.querySelector('.edu-header');
      if (header) {
        header.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');
          items.forEach(el => el.classList.remove('open'));
          if (!isOpen) {
            item.classList.add('open');
          }
        });
      }
    });
  }

  togglePresentationMode() {
    const isPresentation = document.body.classList.toggle('presentation-mode');
    const btnPresMode = document.getElementById('btn-presentation-mode');
    
    if (btnPresMode) {
      if (isPresentation) {
        btnPresMode.innerHTML = `
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          Exit Presentation
        `;
        btnPresMode.className = 'btn btn-danger';
        this.ui.showToast('Entered Presentation Mode (Streamlined for classroom projectors)', 'info');
      } else {
        btnPresMode.innerHTML = `
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"/></svg>
          Presentation Mode
        `;
        btnPresMode.className = 'btn btn-secondary';
      }
    }
  }
}

// Global bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
