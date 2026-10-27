/**
 * OS Process State Transition Visualizer
 * UI Controller, Component Rendering & Modals
 */

class UIController {
  constructor(simulation, diagram, airportScene) {
    this.sim = simulation;
    this.diagram = diagram;
    this.airportScene = airportScene;

    this.cacheDOM();
  }

  cacheDOM() {
    // Clock & Controls
    this.clockEl = document.getElementById('sim-clock');
    this.btnPlay = document.getElementById('btn-play');
    this.btnStep = document.getElementById('btn-step');
    this.btnReset = document.getElementById('btn-reset');
    this.speedSlider = document.getElementById('speed-slider');
    this.speedLabel = document.getElementById('speed-label');
    this.algoSelect = document.getElementById('algo-select');
    this.quantumInput = document.getElementById('quantum-input');
    this.quantumGroup = document.getElementById('quantum-group');

    // ATC Manual Dispatcher Bar
    this.selectManualFlight = document.getElementById('select-manual-flight');
    this.btnManualDispatch = document.getElementById('btn-manual-dispatch');
    this.btnManualPreempt = document.getElementById('btn-manual-preempt');
    this.btnManualWait = document.getElementById('btn-manual-wait');
    this.btnManualCompleteWait = document.getElementById('btn-manual-complete-wait');
    this.btnManualFinish = document.getElementById('btn-manual-finish');

    // Live Dashboard Statistics
    this.statTotalFlights = document.getElementById('stat-total-flights');
    this.statFlightsNew = document.getElementById('stat-flights-new');
    this.statFlightsReady = document.getElementById('stat-flights-ready');
    this.statFlightsRunning = document.getElementById('stat-flights-running');
    this.statFlightsWaiting = document.getElementById('stat-flights-waiting');
    this.statFlightsTerminated = document.getElementById('stat-flights-terminated');
    this.statCurrentTick = document.getElementById('stat-current-tick');
    this.statTransitionsCount = document.getElementById('stat-transitions-count');

    // Narrative Banner
    this.narrativeTitle = document.getElementById('narrative-title');
    this.narrativeTag = document.getElementById('narrative-tag');
    this.narrativeText = document.getElementById('narrative-text');
    this.narrativeSubtext = document.getElementById('narrative-subtext');

    // Operational Columns
    this.readyQueueList = document.getElementById('ready-queue-list');
    this.readyQueueCount = document.getElementById('ready-queue-count');
    this.cpuSocket = document.getElementById('cpu-socket');
    this.cpuContent = document.getElementById('cpu-content');
    this.waitingQueueList = document.getElementById('waiting-queue-list');
    this.waitingQueueCount = document.getElementById('waiting-queue-count');

    // Process Table & Metrics
    this.processTableBody = document.getElementById('process-table-body');
    this.metricCpuUtil = document.getElementById('metric-cpu-util');
    this.metricCpuBar = document.getElementById('metric-cpu-bar');
    this.metricAvgWait = document.getElementById('metric-avg-wait');
    this.metricAvgTat = document.getElementById('metric-avg-tat');
    this.metricCompleted = document.getElementById('metric-completed');
    this.metricContextSwitches = document.getElementById('metric-context-switches');

    // Timeline / Gantt
    this.ganttChart = document.getElementById('gantt-chart');

    // Event Log
    this.eventLogStream = document.getElementById('event-log-stream');

    // Modals
    this.modalProcessDetail = document.getElementById('modal-process-detail');
    this.modalAddProcess = document.getElementById('modal-add-process');
    this.modalEdu = document.getElementById('modal-edu');
    this.modalScript = document.getElementById('modal-script');
  }

  render(eventPayload = {}) {
    this.updateClock();
    this.updateControls();
    this.updateDashboardStats();
    this.updateManualFlightSelect();
    this.updateNarrative();
    this.updateReadyQueue();
    this.updateCpuSlot();
    this.updateWaitingQueue();
    this.updateProcessTable();
    this.updateMetrics();
    this.updateGanttChart();
    this.updateEventLog();

    // Update Airport Traffic Control Visual Scene
    if (this.airportScene) {
      this.airportScene.update(this.sim);
    }

    // Update 5-State Diagram
    if (this.diagram) {
      this.diagram.update(this.sim);
      if (eventPayload.transitions && eventPayload.transitions.length > 0) {
        this.diagram.highlightTransitions(eventPayload.transitions);
      }
    }
  }

  updateClock() {
    if (this.clockEl) {
      this.clockEl.textContent = `Tick: ${this.sim.currentTick}`;
    }
  }

  updateControls() {
    if (!this.btnPlay) return;

    if (this.sim.status === 'RUNNING') {
      this.btnPlay.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>
        Pause
      `;
      this.btnPlay.className = 'btn btn-warning';
    } else {
      this.btnPlay.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>
        Start
      `;
      this.btnPlay.className = 'btn btn-success';
    }

    // Toggle quantum input visibility based on algorithm
    if (this.quantumGroup) {
      this.quantumGroup.style.display = this.sim.algorithm === 'RR' ? 'flex' : 'none';
    }
  }

  updateDashboardStats() {
    const stats = this.sim.getDashboardStats();

    if (this.statTotalFlights) this.statTotalFlights.textContent = stats.totalFlights;
    if (this.statFlightsNew) this.statFlightsNew.textContent = stats.flightsNew;
    if (this.statFlightsReady) this.statFlightsReady.textContent = stats.flightsReady;
    if (this.statFlightsRunning) {
      this.statFlightsRunning.textContent = this.sim.runningProcess ? this.sim.runningProcess.pid : 'None (Idle)';
    }
    if (this.statFlightsWaiting) this.statFlightsWaiting.textContent = stats.flightsWaiting;
    if (this.statFlightsTerminated) this.statFlightsTerminated.textContent = stats.flightsTerminated;
    if (this.statCurrentTick) this.statCurrentTick.textContent = `T=${stats.currentTick}`;
    if (this.statTransitionsCount) this.statTransitionsCount.textContent = stats.successfulTransitions;
  }

  updateManualFlightSelect() {
    if (!this.selectManualFlight) return;

    const currentVal = this.selectManualFlight.value;
    const flights = this.sim.processes;

    if (flights.length === 0) {
      this.selectManualFlight.innerHTML = '<option value="">No flights in simulation</option>';
      return;
    }

    this.selectManualFlight.innerHTML = flights.map(f => {
      const isSel = (currentVal === f.pid) ? 'selected' : '';
      return `<option value="${f.pid}" ${isSel}>${f.pid} [${f.state}] — ${f.aircraftType || f.name}</option>`;
    }).join('');

    // If previously selected flight no longer exists, select the first
    if (!flights.some(f => f.pid === currentVal) && flights.length > 0) {
      this.selectManualFlight.value = flights[0].pid;
    }
  }

  updateNarrative() {
    const nar = this.sim.lastNarrative;
    if (!nar) return;

    if (this.narrativeTitle) this.narrativeTitle.textContent = nar.title;
    if (this.narrativeTag) {
      this.narrativeTag.textContent = nar.tag;
      this.narrativeTag.className = `narrative-tag log-tag ${nar.tag}`;
    }
    if (this.narrativeText) this.narrativeText.textContent = nar.text;
    if (this.narrativeSubtext) this.narrativeSubtext.textContent = nar.subtext;
  }

  updateReadyQueue() {
    if (!this.readyQueueList) return;

    const count = this.sim.readyQueue.length;
    if (this.readyQueueCount) {
      this.readyQueueCount.textContent = count;
    }

    if (count === 0) {
      this.readyQueueList.innerHTML = `
        <div class="queue-empty">
          <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom: 8px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
          </svg>
          <div>Taxiway Alpha is Clear</div>
          <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 2px;">No flights awaiting runway clearance</div>
        </div>
      `;
      return;
    }

    this.readyQueueList.innerHTML = this.sim.readyQueue.map((proc, index) => {
      const isNext = index === 0;
      const progressPct = ((proc.cpuExecutedTicks / proc.totalCpuBurst) * 100).toFixed(0);

      return `
        <div class="proc-card" onclick="app.selectFlight('${proc.pid}')" style="border-left: 4px solid ${proc.color};">
          <div class="proc-card-header">
            <div class="proc-name">
              <span class="proc-pid-pill" style="background: ${proc.color}; color: white;">${proc.pid}</span>
              <span>${proc.name}</span>
            </div>
            ${isNext ? '<span class="badge-count badge-ready" style="font-size: 0.72rem;">#1 Threshold</span>' : `<span class="badge-count" style="background: #f1f5f9; font-size: 0.72rem;">Hold #${index + 1}</span>`}
          </div>
          <div class="proc-stats-row">
            <span>Runway Burst: <strong>${proc.cpuExecutedTicks}/${proc.totalCpuBurst}t</strong></span>
            <span>Taxi Wait: <strong>${proc.waitingTime}t</strong></span>
          </div>
          <div class="proc-progress-bar">
            <div class="proc-progress-fill" style="width: ${progressPct}%; background: ${proc.color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateCpuSlot() {
    if (!this.cpuSocket || !this.cpuContent) return;

    const proc = this.sim.runningProcess;

    if (!proc) {
      this.cpuSocket.classList.remove('cpu-active');
      this.cpuContent.innerHTML = `
        <div class="cpu-idle-state">
          <svg class="cpu-chip-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
          <span style="font-weight: 700; color: #64748b;">Runway 09L is IDLE</span>
          <span style="font-size: 0.76rem; color: #94a3b8;">Awaiting ATC scheduler dispatch</span>
        </div>
      `;
      return;
    }

    this.cpuSocket.classList.add('cpu-active');
    const burstProgress = ((proc.cpuExecutedTicks / proc.totalCpuBurst) * 100).toFixed(0);
    const quantumProgress = this.sim.algorithm === 'RR' 
      ? ((proc.currentQuantum / this.sim.timeQuantum) * 100).toFixed(0) 
      : 100;

    this.cpuContent.innerHTML = `
      <div class="cpu-running-card" onclick="app.selectFlight('${proc.pid}')" style="cursor: pointer; border-left: 4px solid var(--state-running-border);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="proc-pid-pill" style="background: ${proc.color}; color: white; font-weight: 700;">${proc.pid}</span>
            <span style="font-weight: 700; font-size: 0.95rem;">${proc.name}</span>
          </div>
          <span class="badge-count badge-running">● Rolling on Runway 09L</span>
        </div>

        <!-- Runway Burst Progress -->
        <div class="cpu-progress-section">
          <div class="progress-label-row">
            <span>Takeoff Acceleration (CPU Burst)</span>
            <span>${proc.cpuExecutedTicks} / ${proc.totalCpuBurst} ticks (${burstProgress}%)</span>
          </div>
          <div class="proc-progress-bar">
            <div class="proc-progress-fill" style="width: ${burstProgress}%; background: var(--state-running-border);"></div>
          </div>
        </div>

        ${this.sim.algorithm === 'RR' ? `
          <!-- Quantum Slice Progress -->
          <div class="cpu-progress-section" style="margin-top: 10px;">
            <div class="progress-label-row">
              <span>Runway Time Slice Quantum</span>
              <span>${proc.currentQuantum} / ${this.sim.timeQuantum} ticks (${quantumProgress}%)</span>
            </div>
            <div class="proc-progress-bar">
              <div class="proc-progress-fill" style="width: ${quantumProgress}%; background: #3b82f6;"></div>
            </div>
          </div>
        ` : ''}

        ${proc.hasIoRequest && !proc.ioCompleted ? `
          <div style="margin-top: 10px; font-size: 0.76rem; background: #fff7ed; padding: 4px 8px; border-radius: 4px; color: #c2410c; display: flex; align-items: center; gap: 6px;">
            <span>⚠️ Scheduled Weather/Clearance hold after tick ${proc.ioRequestTick} (${proc.ioDuration}t)</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  updateWaitingQueue() {
    if (!this.waitingQueueList) return;

    const count = this.sim.waitingQueue.length;
    if (this.waitingQueueCount) {
      this.waitingQueueCount.textContent = count;
    }

    if (count === 0) {
      this.waitingQueueList.innerHTML = `
        <div class="queue-empty">
          <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom: 8px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>Holding Apron is Empty</div>
          <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 2px;">No flights holding for weather or clearance</div>
        </div>
      `;
      return;
    }

    this.waitingQueueList.innerHTML = this.sim.waitingQueue.map(proc => {
      const ioProgress = (((proc.ioDuration - proc.remainingIoTime) / proc.ioDuration) * 100).toFixed(0);

      return `
        <div class="proc-card" onclick="app.selectFlight('${proc.pid}')" style="border-left: 4px solid var(--state-waiting-border);">
          <div class="proc-card-header">
            <div class="proc-name">
              <span class="proc-pid-pill" style="background: ${proc.color}; color: white;">${proc.pid}</span>
              <span>${proc.name}</span>
            </div>
            <span class="badge-count badge-waiting">Weather Hold</span>
          </div>
          <div class="proc-stats-row">
            <span>Remaining Hold: <strong>${proc.remainingIoTime}t / ${proc.ioDuration}t</strong></span>
            <span>Total Hold: <strong>${proc.totalIoTimeSpent}t</strong></span>
          </div>
          <div class="proc-progress-bar">
            <div class="proc-progress-fill" style="width: ${ioProgress}%; background: var(--state-waiting-border);"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateProcessTable() {
    if (!this.processTableBody) return;

    this.processTableBody.innerHTML = this.sim.processes.map(proc => {
      const stateBadge = `<span class="badge-count badge-state-${proc.state}">${proc.state}</span>`;
      const ioInfo = proc.hasIoRequest 
        ? `${proc.ioCompleted ? '✓ Cleared' : `Hold at ${proc.ioRequestTick}t (${proc.ioDuration}t)`}`
        : 'Direct';
      const tat = proc.turnaroundTime !== null ? `${proc.turnaroundTime}t` : 'Active';
      const progress = ((proc.cpuExecutedTicks / proc.totalCpuBurst) * 100).toFixed(0);

      return `
        <tr onclick="app.selectFlight('${proc.pid}')" style="cursor: pointer;">
          <td style="font-family: var(--font-mono); font-weight: 700; color: ${proc.color};">${proc.pid}</td>
          <td style="font-weight: 600;">${proc.aircraftType || proc.name}</td>
          <td>${stateBadge}</td>
          <td>T=${proc.arrivalTime}</td>
          <td>${proc.totalCpuBurst}t</td>
          <td style="font-weight: 700;">${proc.remainingCpuTime}t</td>
          <td style="font-size: 0.82rem; color: #475569;">${ioInfo}</td>
          <td>${proc.waitingTime}t</td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">${proc.transitionCount}</td>
          <td style="min-width: 70px;">
            <div class="proc-progress-bar" style="height: 5px;">
              <div class="proc-progress-fill" style="width: ${progress}%; background: ${proc.color};"></div>
            </div>
          </td>
          <td>
            <button class="btn btn-secondary" style="padding: 3px 8px; font-size: 0.75rem;" onclick="event.stopPropagation(); app.showProcessDetail('${proc.pid}')">
              Inspect Flight / PCB
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  updateMetrics() {
    if (this.metricCpuUtil) {
      this.metricCpuUtil.textContent = `${this.sim.cpuUtilization}%`;
    }
    if (this.metricCpuBar) {
      this.metricCpuBar.style.width = `${this.sim.cpuUtilization}%`;
    }
    if (this.metricAvgWait) {
      this.metricAvgWait.textContent = `${this.sim.averageWaitingTime}t`;
    }
    if (this.metricAvgTat) {
      this.metricAvgTat.textContent = `${this.sim.averageTurnaroundTime}t`;
    }
    if (this.metricCompleted) {
      this.metricCompleted.textContent = `${this.sim.terminatedProcesses.length} / ${this.sim.processes.length}`;
    }
    if (this.metricContextSwitches) {
      this.metricContextSwitches.textContent = this.sim.contextSwitches;
    }
  }

  updateGanttChart() {
    if (!this.ganttChart) return;

    if (this.sim.processes.length === 0) {
      this.ganttChart.innerHTML = '<div style="color: #94a3b8; font-size: 0.85rem; padding: 10px;">No timeline data available.</div>';
      return;
    }

    const maxTicks = Math.max(this.sim.currentTick, 1);

    this.ganttChart.innerHTML = this.sim.processes.map(proc => {
      let blocksHtml = '';

      for (let t = 0; t < maxTicks; t++) {
        const stateAtTick = proc.timeline[t] || (t < proc.arrivalTime ? 'NONE' : proc.state);
        if (stateAtTick === 'NONE') {
          blocksHtml += `<div class="gantt-block" style="background: transparent; border: 1px dashed #e2e8f0; color: #cbd5e1;" title="T${t}: Not arrived">-</div>`;
        } else {
          const letter = stateAtTick.charAt(0);
          blocksHtml += `
            <div class="gantt-block ${stateAtTick}" title="${proc.pid} at Tick ${t}: ${stateAtTick}">
              ${letter}
            </div>
          `;
        }
      }

      return `
        <div class="gantt-row">
          <div class="gantt-label" style="color: ${proc.color};">${proc.pid}</div>
          <div class="gantt-blocks">
            ${blocksHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  updateEventLog() {
    if (!this.eventLogStream) return;

    if (this.sim.eventLogs.length === 0) {
      this.eventLogStream.innerHTML = '<div style="color: #94a3b8; padding: 8px;">No events recorded yet. Click Start, Step, or use ATC commands.</div>';
      return;
    }

    this.eventLogStream.innerHTML = this.sim.eventLogs.slice(0, 60).map(entry => {
      return `
        <div class="log-entry">
          <span class="log-tick">T=${entry.tick}</span>
          <span class="log-tag ${entry.tag}">[${entry.tag}]</span>
          <span class="log-desc">${entry.description}</span>
        </div>
      `;
    }).join('');
  }

  showModal(modalEl) {
    if (modalEl) {
      modalEl.classList.add('active');
    }
  }

  hideModal(modalEl) {
    if (modalEl) {
      modalEl.classList.remove('active');
    }
  }

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }
}
