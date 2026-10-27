/**
 * OS Process State Transition Visualizer
 * Airport Traffic Control Center (ATC) — Animated Simulation Scene
 */

class AirportScene {
  constructor(svgElementId) {
    this.svg = document.getElementById(svgElementId);
    this.selectedFlightId = null;
    this.flightPositions = {}; // pid -> { x, y, angle }

    this.init();
  }

  init() {
    if (!this.svg) return;
    this.renderAirportLayout();
    this.bindEvents();
  }

  renderAirportLayout() {
    const width = 1100;
    const height = 480;

    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.svg.innerHTML = `
      <defs>
        <!-- Runway Asphalt Pattern -->
        <linearGradient id="runway-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="50%" stop-color="#334155" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>

        <!-- Grass Landscape -->
        <linearGradient id="grass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#f1f5f9" />
        </linearGradient>

        <!-- Taxiway Color -->
        <linearGradient id="taxiway-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#cbd5e1" />
          <stop offset="100%" stop-color="#94a3b8" />
        </linearGradient>

        <!-- Radar Sweep Gradient -->
        <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(37, 99, 235, 0.35)" />
          <stop offset="100%" stop-color="rgba(37, 99, 235, 0)" />
        </radialGradient>

        <!-- Aircraft Shadow -->
        <filter id="plane-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="1" dy="3" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.25"/>
        </filter>
        <filter id="runway-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#22c55e" flood-opacity="0.45"/>
        </filter>
      </defs>

      <!-- BASE GROUND -->
      <rect width="${width}" height="${height}" fill="url(#grass-grad)" rx="16" ry="16" />

      <!-- ========================================== -->
      <!-- ZONE 1: ARRIVAL AIRSPACE [NEW] -->
      <!-- ========================================== -->
      <g id="zone-arrival">
        <rect x="25" y="25" width="220" height="135" rx="12" fill="#f5f3ff" stroke="#c084fc" stroke-width="1.8" stroke-dasharray="6,4" />
        <!-- Header -->
        <rect x="25" y="25" width="220" height="28" rx="12" fill="#e9d5ff" />
        <rect x="25" y="43" width="220" height="10" fill="#e9d5ff" />
        <text x="35" y="44" font-family="var(--font-sans)" font-size="12" font-weight="700" fill="#7e22ce">
          🛬 1. ARRIVAL AIRSPACE [NEW]
        </text>
        <text x="35" y="70" font-family="var(--font-sans)" font-size="10" fill="#6b21a8">
          Flights registered & entering system
        </text>

        <!-- Arrival Holding Slots -->
        <rect x="40" y="82" width="55" height="60" rx="8" fill="#ffffff" stroke="#e9d5ff" stroke-width="1.5" />
        <text x="67" y="116" font-family="var(--font-mono)" font-size="9" fill="#a855f7" text-anchor="middle">Gate A1</text>

        <rect x="105" y="82" width="55" height="60" rx="8" fill="#ffffff" stroke="#e9d5ff" stroke-width="1.5" />
        <text x="132" y="116" font-family="var(--font-mono)" font-size="9" fill="#a855f7" text-anchor="middle">Gate A2</text>

        <rect x="170" y="82" width="55" height="60" rx="8" fill="#ffffff" stroke="#e9d5ff" stroke-width="1.5" />
        <text x="197" y="116" font-family="var(--font-mono)" font-size="9" fill="#a855f7" text-anchor="middle">Gate A3</text>
      </g>

      <!-- ========================================== -->
      <!-- ZONE 2: TAXIWAY ALPHA & RUNWAY QUEUE [READY] -->
      <!-- ========================================== -->
      <g id="zone-taxiway">
        <rect x="25" y="180" width="220" height="275" rx="12" fill="#eff6ff" stroke="#60a5fa" stroke-width="1.8" />
        <!-- Header -->
        <rect x="25" y="180" width="220" height="28" rx="12" fill="#dbeafe" />
        <rect x="25" y="198" width="220" height="10" fill="#dbeafe" />
        <text x="35" y="199" font-family="var(--font-sans)" font-size="12" font-weight="700" fill="#1d4ed8">
          🚕 2. TAXIWAY QUEUE [READY]
        </text>
        <text x="35" y="222" font-family="var(--font-sans)" font-size="10" fill="#1e40af">
          FIFO order: Awaiting runway clearance
        </text>

        <!-- Taxiway Strip with Yellow Centerline -->
        <path d="M 135 240 L 135 435" stroke="#facc15" stroke-width="3" stroke-dasharray="6,4" />

        <!-- Queue Slots (Hold Positions) -->
        <!-- Hold #1: Threshold / Next up -->
        <rect x="45" y="238" width="180" height="42" rx="8" fill="#ffffff" stroke="#93c5fd" stroke-width="1.5" />
        <rect x="45" y="238" width="28" height="42" rx="8" fill="#2563eb" />
        <text x="59" y="264" font-family="var(--font-mono)" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">#1</text>
        <text x="82" y="256" font-family="var(--font-sans)" font-size="11" font-weight="700" fill="#1e3a8a">Hold Position 1 (Threshold)</text>
        <text x="82" y="271" font-family="var(--font-sans)" font-size="9" fill="#64748b">Next flight to be dispatched</text>

        <!-- Hold #2 -->
        <rect x="45" y="290" width="180" height="42" rx="8" fill="#ffffff" stroke="#bfdbfe" stroke-width="1.5" />
        <rect x="45" y="290" width="28" height="42" rx="8" fill="#60a5fa" />
        <text x="59" y="316" font-family="var(--font-mono)" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">#2</text>
        <text x="82" y="308" font-family="var(--font-sans)" font-size="11" font-weight="700" fill="#1e3a8a">Hold Position 2</text>
        <text x="82" y="323" font-family="var(--font-sans)" font-size="9" fill="#64748b">In taxiway queue</text>

        <!-- Hold #3 -->
        <rect x="45" y="342" width="180" height="42" rx="8" fill="#ffffff" stroke="#dbeafe" stroke-width="1.5" />
        <rect x="45" y="342" width="28" height="42" rx="8" fill="#93c5fd" />
        <text x="59" y="368" font-family="var(--font-mono)" font-size="11" font-weight="700" fill="#1e3a8a" text-anchor="middle">#3</text>
        <text x="82" y="360" font-family="var(--font-sans)" font-size="11" font-weight="700" fill="#1e3a8a">Hold Position 3</text>
        <text x="82" y="375" font-family="var(--font-sans)" font-size="9" fill="#64748b">In taxiway queue</text>

        <!-- Hold #4 -->
        <rect x="45" y="394" width="180" height="42" rx="8" fill="#ffffff" stroke="#e0f2fe" stroke-width="1.5" />
        <rect x="45" y="394" width="28" height="42" rx="8" fill="#cbd5e1" />
        <text x="59" y="420" font-family="var(--font-mono)" font-size="11" font-weight="700" fill="#334155" text-anchor="middle">#4</text>
        <text x="82" y="412" font-family="var(--font-sans)" font-size="11" font-weight="700" fill="#334155">Hold Position 4</text>
        <text x="82" y="427" font-family="var(--font-sans)" font-size="9" fill="#64748b">In taxiway queue</text>
      </g>

      <!-- TAXIWAY LINK TO RUNWAY -->
      <path d="M 245 259 L 305 259 L 305 210 L 320 210" fill="none" stroke="#facc15" stroke-width="3" stroke-dasharray="6,4" />

      <!-- ========================================== -->
      <!-- ZONE 3: ACTIVE RUNWAY 09L [RUNNING / CPU] -->
      <!-- ========================================== -->
      <g id="zone-runway">
        <!-- Asphalt Runway Outer Bed -->
        <rect x="290" y="115" width="510" height="150" rx="14" fill="#0f172a" />
        
        <!-- Paved Runway Surface -->
        <rect id="runway-surface" x="300" y="125" width="490" height="130" rx="10" fill="url(#runway-grad)" stroke="#475569" stroke-width="1.5" />
        
        <!-- Runway Edge Lights (Green at threshold, White along edge) -->
        <circle cx="310" cy="135" r="3" fill="#22c55e" />
        <circle cx="310" cy="245" r="3" fill="#22c55e" />
        <circle cx="545" cy="130" r="2.5" fill="#f8fafc" />
        <circle cx="545" cy="250" r="2.5" fill="#f8fafc" />
        <circle cx="780" cy="135" r="3" fill="#ef4444" />
        <circle cx="780" cy="245" r="3" fill="#ef4444" />

        <!-- Threshold Piano Keys (Runway 09L) -->
        <g fill="#ffffff">
          <rect x="315" y="145" width="5" height="90" />
          <rect x="325" y="145" width="5" height="90" />
          <rect x="335" y="145" width="5" height="90" />
          <rect x="345" y="145" width="5" height="90" />
          <rect x="355" y="145" width="5" height="90" />
        </g>

        <!-- Runway Number -->
        <text x="385" y="198" font-family="var(--font-mono)" font-size="24" font-weight="900" fill="#ffffff" letter-spacing="2">09L</text>

        <!-- White Centerline Dashes -->
        <line x1="440" y1="190" x2="490" y2="190" stroke="#ffffff" stroke-width="4" stroke-dasharray="14,12" />
        <line x1="505" y1="190" x2="680" y2="190" stroke="#ffffff" stroke-width="4" stroke-dasharray="14,12" />

        <!-- Touchdown Zone Stripes -->
        <g fill="#ffffff" opacity="0.8">
          <rect x="470" y="145" width="20" height="4" />
          <rect x="470" y="231" width="20" height="4" />
          <rect x="560" y="145" width="20" height="4" />
          <rect x="560" y="231" width="20" height="4" />
          <rect x="650" y="145" width="20" height="4" />
          <rect x="650" y="231" width="20" height="4" />
        </g>

        <!-- Header Pill -->
        <g transform="translate(300, 80)">
          <rect width="490" height="34" rx="8" fill="#f0fdf4" stroke="#22c55e" stroke-width="1.5" />
          <circle cx="20" cy="17" r="6" fill="#16a34a">
            <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <text x="36" y="22" font-family="var(--font-sans)" font-size="12" font-weight="700" fill="#15803d">
            🛫 3. ACTIVE RUNWAY 09L [RUNNING — SINGLE CPU CORE]
          </text>
          <text x="470" y="21" font-family="var(--font-mono)" font-size="10" font-weight="700" fill="#15803d" text-anchor="end">
            MUTUAL EXCLUSION: 1 FLIGHT ONLY
          </text>
        </g>

        <!-- Active Aircraft Roll Track -->
        <g id="runway-active-track"></g>
      </g>

      <!-- ========================================== -->
      <!-- AIRPORT CONTROL TOWER (ATC / OS SCHEDULER) -->
      <!-- ========================================== -->
      <g id="control-tower" transform="translate(500, 10)">
        <rect width="90" height="60" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
        <!-- Glass Cab -->
        <rect x="10" y="8" width="70" height="24" rx="6" fill="#0284c7" opacity="0.85" />
        <text x="45" y="24" font-family="var(--font-sans)" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle">ATC TOWER</text>
        <text x="45" y="44" font-family="var(--font-sans)" font-size="8" font-weight="600" fill="#94a3b8" text-anchor="middle">OS Dispatcher</text>
        <!-- Antenna & Beacon -->
        <line x1="45" y1="8" x2="45" y2="0" stroke="#f43f5e" stroke-width="2" />
        <circle cx="45" cy="0" r="3" fill="#f43f5e">
          <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
        </circle>
      </g>

      <!-- ========================================== -->
      <!-- ZONE 4: HOLDING APRON & WEATHER HOLD [WAITING] -->
      <!-- ========================================== -->
      <g id="zone-holding">
        <rect x="290" y="300" width="510" height="155" rx="12" fill="#fff7ed" stroke="#fb923c" stroke-width="1.8" />
        <!-- Header -->
        <rect x="290" y="300" width="510" height="28" rx="12" fill="#ffedd5" />
        <rect x="290" y="318" width="510" height="10" fill="#ffedd5" />
        <text x="305" y="319" font-family="var(--font-sans)" font-size="12" font-weight="700" fill="#c2410c">
          ⏳ 4. HOLDING APRON & DE-ICING BAY [WAITING / BLOCKED]
        </text>
        <text x="785" y="319" font-family="var(--font-sans)" font-size="10" font-weight="600" fill="#ea580c" text-anchor="end">
          Awaiting Weather / ATC Clearance
        </text>

        <!-- Holding Stand 1 -->
        <rect x="310" y="340" width="145" height="95" rx="8" fill="#ffffff" stroke="#fed7aa" stroke-width="1.5" />
        <text x="382" y="360" font-family="var(--font-sans)" font-size="11" font-weight="700" fill="#9a3412" text-anchor="middle">Holding Bay H1</text>
        <text x="382" y="375" font-family="var(--font-sans)" font-size="9" fill="#78716c" text-anchor="middle">Weather Radar Check</text>

        <!-- Holding Stand 2 -->
        <rect x="472" y="340" width="145" height="95" rx="8" fill="#ffffff" stroke="#fed7aa" stroke-width="1.5" />
        <text x="544" y="360" font-family="var(--font-sans)" font-size="11" font-weight="700" fill="#9a3412" text-anchor="middle">Holding Bay H2</text>
        <text x="544" y="375" font-family="var(--font-sans)" font-size="9" fill="#78716c" text-anchor="middle">Maintenance Inspection</text>

        <!-- Holding Stand 3 -->
        <rect x="635" y="340" width="145" height="95" rx="8" fill="#ffffff" stroke="#fed7aa" stroke-width="1.5" />
        <text x="707" y="360" font-family="var(--font-sans)" font-size="11" font-weight="700" fill="#9a3412" text-anchor="middle">Holding Bay H3</text>
        <text x="707" y="375" font-family="var(--font-sans)" font-size="9" fill="#78716c" text-anchor="middle">ATC Airway Clearance</text>
      </g>

      <!-- Connection path from Runway to Holding Apron -->
      <path d="M 545 255 L 545 300" fill="none" stroke="#ea580c" stroke-width="2.5" stroke-dasharray="4,4" />

      <!-- Connection path from Holding Apron back to Ready Taxiway -->
      <path d="M 310 390 L 260 390 L 260 260 L 245 260" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-dasharray="4,4" />

      <!-- ========================================== -->
      <!-- ZONE 5: DEPARTED FLIGHTS [TERMINATED] -->
      <!-- ========================================== -->
      <g id="zone-departed">
        <rect x="830" y="25" width="245" height="430" rx="12" fill="#fef2f2" stroke="#f87171" stroke-width="1.8" />
        <!-- Header -->
        <rect x="830" y="25" width="245" height="28" rx="12" fill="#fee2e2" />
        <rect x="830" y="43" width="245" height="10" fill="#fee2e2" />
        <text x="842" y="44" font-family="var(--font-sans)" font-size="12" font-weight="700" fill="#b91c1c">
          ✅ 5. DEPARTURE GATES [TERMINATED]
        </text>
        <text x="842" y="70" font-family="var(--font-sans)" font-size="10" fill="#dc2626">
          Operations finished; resources freed
        </text>

        <!-- Departed Stands -->
        <rect x="845" y="85" width="215" height="70" rx="8" fill="#ffffff" stroke="#fecaca" stroke-width="1.5" />
        <text x="857" y="105" font-family="var(--font-sans)" font-size="11" font-weight="700" fill="#991b1b">Gate D1 (Climb En Route)</text>

        <rect x="845" y="165" width="215" height="70" rx="8" fill="#ffffff" stroke="#fecaca" stroke-width="1.5" />
        <text x="857" y="185" font-family="var(--font-sans)" font-size="11" font-weight="700" fill="#991b1b">Gate D2 (Cruising FL350)</text>

        <rect x="845" y="245" width="215" height="70" rx="8" fill="#ffffff" stroke="#fecaca" stroke-width="1.5" />
        <text x="857" y="265" font-family="var(--font-sans)" font-size="11" font-weight="700" fill="#991b1b">Gate D3 (Completed)</text>

        <rect x="845" y="325" width="215" height="70" rx="8" fill="#ffffff" stroke="#fecaca" stroke-width="1.5" />
        <text x="857" y="345" font-family="var(--font-sans)" font-size="11" font-weight="700" fill="#991b1b">Gate D4 (Completed)</text>
      </g>

      <!-- Runway to Departure Path -->
      <path d="M 790 190 L 830 190" fill="none" stroke="#22c55e" stroke-width="3" stroke-dasharray="6,4" />

      <!-- ========================================== -->
      <!-- DYNAMIC AIRCRAFT SPRITES LAYER -->
      <!-- ========================================== -->
      <g id="aircraft-layer"></g>

      <!-- Educational Disclaimer Watermark -->
      <text x="${width / 2}" y="${height - 10}" font-family="var(--font-sans)" font-size="9" fill="#94a3b8" text-anchor="middle">
        ✈️ Educational Analogy: Models the 5-State Operating System Process Lifecycle. Not intended for actual aviation air traffic control.
      </text>
    `;
  }

  bindEvents() {
    // Aircraft click delegation handled in renderAircraft
  }

  /**
   * Main update loop: positions and animates every aircraft based on its current OS process state
   */
  update(simulation) {
    if (!simulation) return;
    const aircraftLayer = document.getElementById('aircraft-layer');
    if (!aircraftLayer) return;

    // Check runway highlight state
    const runwaySurface = document.getElementById('runway-surface');
    if (runwaySurface) {
      if (simulation.runningProcess) {
        runwaySurface.setAttribute('stroke', '#22c55e');
        runwaySurface.setAttribute('stroke-width', '3');
        runwaySurface.setAttribute('filter', 'url(#runway-glow)');
      } else {
        runwaySurface.setAttribute('stroke', '#475569');
        runwaySurface.setAttribute('stroke-width', '1.5');
        runwaySurface.removeAttribute('filter');
      }
    }

    // Determine target (x, y, angle) coordinates for each flight
    const targetCoords = {};

    // 1. NEW Flights: Arrival Bay slots
    const newFlights = simulation.processes.filter(p => p.state === ProcessState.NEW);
    newFlights.forEach((proc, idx) => {
      const baseX = 67 + idx * 65;
      const baseY = 115;
      targetCoords[proc.pid] = { x: Math.min(baseX, 200), y: baseY, angle: 90 };
    });

    // 2. READY Flights: Taxiway Alpha Queue slots
    simulation.readyQueue.forEach((proc, idx) => {
      const slotY = 259 + idx * 52;
      targetCoords[proc.pid] = { x: 135, y: Math.min(slotY, 415), angle: 0 };
    });

    // 3. RUNNING Flight: Active Runway 09L centerline
    if (simulation.runningProcess) {
      const proc = simulation.runningProcess;
      // Progress along runway based on burst completion
      const pct = proc.totalCpuBurst > 0 ? (proc.cpuExecutedTicks / proc.totalCpuBurst) : 0;
      const runwayX = 420 + pct * 240; // Glides smoothly along centerline
      targetCoords[proc.pid] = { x: runwayX, y: 190, angle: 90 };
    }

    // 4. WAITING Flights: Holding Apron Bays
    simulation.waitingQueue.forEach((proc, idx) => {
      const baseX = 382 + idx * 162;
      targetCoords[proc.pid] = { x: Math.min(baseX, 707), y: 390, angle: 0 };
    });

    // 5. TERMINATED Flights: Departure Gates
    simulation.terminatedProcesses.forEach((proc, idx) => {
      const baseY = 120 + idx * 80;
      targetCoords[proc.pid] = { x: 950, y: Math.min(baseY, 360), angle: 90 };
    });

    // Render / update each aircraft sprite
    aircraftLayer.innerHTML = simulation.processes.map(proc => {
      const pos = targetCoords[proc.pid] || { x: 70, y: 110, angle: 0 };
      const isSelected = this.selectedFlightId === proc.pid;
      const isRunning = simulation.runningProcess && simulation.runningProcess.pid === proc.pid;
      const isWaiting = proc.state === ProcessState.WAITING;

      return `
        <g id="aircraft-${proc.pid}" class="aircraft-sprite ${isSelected ? 'selected' : ''}" 
           transform="translate(${pos.x}, ${pos.y}) rotate(${pos.angle})"
           onclick="app.selectFlight('${proc.pid}')" style="cursor: pointer; transition: transform 0.6s cubic-bezier(0.34, 1.2, 0.64, 1);">
          
          <!-- Aircraft Airframe Graphic (Top-Down View) -->
          <g filter="url(#plane-shadow)">
            <!-- Fuselage -->
            <path d="M 0 -22 C 4 -22, 5 -12, 5 14 C 5 22, -5 22, -5 14 C -5 -12, -4 -22, 0 -22 Z" fill="#ffffff" stroke="${proc.color}" stroke-width="2" />
            
            <!-- Nose Cone Accent -->
            <path d="M 0 -22 C 3 -22, 4 -16, 0 -13 C -4 -16, -3 -22, 0 -22 Z" fill="${proc.color}" />

            <!-- Main Wings -->
            <path d="M 0 -4 L 28 8 L 28 13 L 0 5 L -28 13 L -28 8 Z" fill="#ffffff" stroke="${proc.color}" stroke-width="1.8" />

            <!-- Jet Turbine Engines -->
            <rect x="11" y="2" width="4" height="10" rx="2" fill="#334155" />
            <rect x="-15" y="2" width="4" height="10" rx="2" fill="#334155" />

            <!-- Horizontal Stabilizers (Tail Wings) -->
            <path d="M 0 16 L 12 21 L 12 24 L 0 21 L -12 24 L -12 21 Z" fill="#ffffff" stroke="${proc.color}" stroke-width="1.5" />

            <!-- Vertical Tail Fin -->
            <rect x="-1.5" y="14" width="3" height="8" rx="1.5" fill="${proc.color}" />
          </g>

          <!-- Status Ring / Beacon Light -->
          ${isRunning ? `
            <circle cx="0" cy="0" r="26" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-dasharray="6,4">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3s" repeatCount="indefinite" />
            </circle>
          ` : ''}

          ${isWaiting ? `
            <circle cx="0" cy="0" r="24" fill="none" stroke="#ea580c" stroke-width="2" stroke-dasharray="4,4">
              <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="4s" repeatCount="indefinite" />
            </circle>
          ` : ''}

          <!-- Flight ID Tag (Rotated horizontally for readability) -->
          <g transform="rotate(${-pos.angle}) translate(0, -32)">
            <rect x="-26" y="-10" width="52" height="18" rx="6" fill="#0f172a" stroke="${proc.color}" stroke-width="1.5" />
            <text x="0" y="3" font-family="var(--font-mono)" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle">
              ${proc.pid}
            </text>
          </g>
        </g>
      `;
    }).join('');
  }

  selectFlight(flightId) {
    this.selectedFlightId = flightId;
    if (window.app && window.app.selectFlight) {
      window.app.selectFlight(flightId);
    }
  }
}

