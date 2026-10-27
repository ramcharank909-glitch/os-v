/**
 * OS Process State Transition Visualizer
 * SVG Process State Diagram & Dynamic Animations
 */

class StateDiagram {
  constructor(svgElementId) {
    this.svg = document.getElementById(svgElementId);
    this.nodes = {};
    this.paths = {};
    this.activeParticle = null;
    this.highlightTimeout = null;

    this.init();
  }

  init() {
    if (!this.svg) return;
    this.renderDiagram();
    this.bindEvents();
  }

  renderDiagram() {
    // Define SVG contents
    const width = 940;
    const height = 360;

    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.svg.innerHTML = `
      <defs>
        <!-- Marker Arrow Heads -->
        <marker id="arrow-default" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
        </marker>
        <marker id="arrow-admit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#9333ea" />
        </marker>
        <marker id="arrow-dispatch" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#16a34a" />
        </marker>
        <marker id="arrow-preempt" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
        </marker>
        <marker id="arrow-io-req" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#ea580c" />
        </marker>
        <marker id="arrow-io-done" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
        </marker>
        <marker id="arrow-exit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
        </marker>

        <!-- Drop Shadows -->
        <filter id="node-shadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.08"/>
        </filter>
        <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Connection Lines Layer -->
      <g id="transitions-layer">
        <!-- 1. NEW -> READY (Admitted) -->
        <path id="path-admit" class="transition-path" d="M 180 180 L 265 180" marker-end="url(#arrow-default)" />
        <g id="lbl-admit" class="transition-label">
          <rect x="195" y="162" width="60" height="20" class="transition-label-bg" />
          <text x="225" y="172" class="transition-label-text">Admitted</text>
        </g>

        <!-- 2. READY -> RUNNING (Dispatch) -->
        <path id="path-dispatch" class="transition-path" d="M 395 165 L 515 165" marker-end="url(#arrow-default)" />
        <g id="lbl-dispatch" class="transition-label">
          <rect x="410" y="145" width="90" height="20" class="transition-label-bg" />
          <text x="455" y="155" class="transition-label-text">Scheduler Dispatch</text>
        </g>

        <!-- 3. RUNNING -> READY (Preemption / Time Quantum) -->
        <!-- Curved path above: from Running top to Ready top -->
        <path id="path-preempt" class="transition-path" d="M 545 135 C 500 70, 410 70, 365 135" marker-end="url(#arrow-default)" />
        <g id="lbl-preempt" class="transition-label">
          <rect x="385" y="65" width="140" height="20" class="transition-label-bg" />
          <text x="455" y="75" class="transition-label-text">Interrupt / Time Slice</text>
        </g>

        <!-- 4. RUNNING -> WAITING (I/O Request) -->
        <path id="path-io-req" class="transition-path" d="M 575 225 C 575 270, 560 295, 525 300" marker-end="url(#arrow-default)" />
        <g id="lbl-io-req" class="transition-label">
          <rect x="545" y="248" width="85" height="20" class="transition-label-bg" />
          <text x="587" y="258" class="transition-label-text">I/O or Event Wait</text>
        </g>

        <!-- 5. WAITING -> READY (I/O Complete) -->
        <path id="path-io-done" class="transition-path" d="M 385 300 C 350 295, 335 270, 335 225" marker-end="url(#arrow-default)" />
        <g id="lbl-io-done" class="transition-label">
          <rect x="280" y="248" width="95" height="20" class="transition-label-bg" />
          <text x="327" y="258" class="transition-label-text">I/O Completion</text>
        </g>

        <!-- 6. RUNNING -> TERMINATED (Exit) -->
        <path id="path-exit" class="transition-path" d="M 645 180 L 745 180" marker-end="url(#arrow-default)" />
        <g id="lbl-exit" class="transition-label">
          <rect x="665" y="162" width="60" height="20" class="transition-label-bg" />
          <text x="695" y="172" class="transition-label-text">Terminated</text>
        </g>
      </g>

      <!-- Animation Particle Layer -->
      <g id="particle-layer"></g>

      <!-- State Nodes Layer -->
      <g id="nodes-layer">
        <!-- 1. NEW NODE -->
        <g id="node-NEW" class="state-node-group" data-state="NEW" filter="url(#node-shadow)">
          <rect x="60" y="135" width="120" height="90" rx="16" ry="16" class="state-node-bg" fill="#f3e8ff" stroke="#a855f7" stroke-width="2" />
          <text x="120" y="165" text-anchor="middle" class="state-node-title" fill="#7e22ce">NEW</text>
          <text x="120" y="182" text-anchor="middle" class="state-node-desc">Being Created</text>
          <!-- Count badge -->
          <circle cx="165" cy="148" r="13" class="state-badge-circle" stroke="#a855f7" />
          <text id="count-NEW" x="165" y="148" class="state-badge-text" fill="#7e22ce">0</text>
          <!-- Process tokens container -->
          <g id="tokens-NEW" class="node-tokens-group" transform="translate(68, 192)"></g>
        </g>

        <!-- 2. READY NODE -->
        <g id="node-READY" class="state-node-group" data-state="READY" filter="url(#node-shadow)">
          <rect x="265" y="135" width="130" height="90" rx="16" ry="16" class="state-node-bg" fill="#eff6ff" stroke="#3b82f6" stroke-width="2" />
          <text x="330" y="165" text-anchor="middle" class="state-node-title" fill="#1d4ed8">READY</text>
          <text x="330" y="182" text-anchor="middle" class="state-node-desc">Ready for CPU</text>
          <!-- Count badge -->
          <circle cx="380" cy="148" r="13" class="state-badge-circle" stroke="#3b82f6" />
          <text id="count-READY" x="380" y="148" class="state-badge-text" fill="#1d4ed8">0</text>
          <!-- Process tokens container -->
          <g id="tokens-READY" class="node-tokens-group" transform="translate(273, 192)"></g>
        </g>

        <!-- 3. RUNNING NODE -->
        <g id="node-RUNNING" class="state-node-group" data-state="RUNNING" filter="url(#node-shadow)">
          <rect x="515" y="135" width="130" height="90" rx="16" ry="16" class="state-node-bg" fill="#f0fdf4" stroke="#22c55e" stroke-width="2" />
          <text x="580" y="165" text-anchor="middle" class="state-node-title" fill="#15803d">RUNNING</text>
          <text x="580" y="182" text-anchor="middle" class="state-node-desc">Executing on CPU</text>
          <!-- Count badge -->
          <circle cx="630" cy="148" r="13" class="state-badge-circle" stroke="#22c55e" />
          <text id="count-RUNNING" x="630" y="148" class="state-badge-text" fill="#15803d">0</text>
          <!-- Process tokens container -->
          <g id="tokens-RUNNING" class="node-tokens-group" transform="translate(523, 192)"></g>
        </g>

        <!-- 4. WAITING / BLOCKED NODE -->
        <g id="node-WAITING" class="state-node-group" data-state="WAITING" filter="url(#node-shadow)">
          <rect x="385" y="270" width="140" height="80" rx="16" ry="16" class="state-node-bg" fill="#fff7ed" stroke="#f97316" stroke-width="2" />
          <text x="455" y="298" text-anchor="middle" class="state-node-title" fill="#c2410c">WAITING</text>
          <text x="455" y="315" text-anchor="middle" class="state-node-desc">Blocked for I/O</text>
          <!-- Count badge -->
          <circle cx="510" cy="282" r="13" class="state-badge-circle" stroke="#f97316" />
          <text id="count-WAITING" x="510" y="282" class="state-badge-text" fill="#c2410c">0</text>
          <!-- Process tokens container -->
          <g id="tokens-WAITING" class="node-tokens-group" transform="translate(393, 323)"></g>
        </g>

        <!-- 5. TERMINATED NODE -->
        <g id="node-TERMINATED" class="state-node-group" data-state="TERMINATED" filter="url(#node-shadow)">
          <rect x="745" y="135" width="130" height="90" rx="16" ry="16" class="state-node-bg" fill="#fef2f2" stroke="#ef4444" stroke-width="2" />
          <text x="810" y="165" text-anchor="middle" class="state-node-title" fill="#b91c1c">TERMINATED</text>
          <text x="810" y="182" text-anchor="middle" class="state-node-desc">Finished / Exited</text>
          <!-- Count badge -->
          <circle cx="860" cy="148" r="13" class="state-badge-circle" stroke="#ef4444" />
          <text id="count-TERMINATED" x="860" y="148" class="state-badge-text" fill="#b91c1c">0</text>
          <!-- Process tokens container -->
          <g id="tokens-TERMINATED" class="node-tokens-group" transform="translate(753, 192)"></g>
        </g>
      </g>
    `;

    // Cache element references
    this.paths = {
      'NEW->READY': { el: document.getElementById('path-admit'), marker: 'arrow-admit', cls: 'active-admit' },
      'READY->RUNNING': { el: document.getElementById('path-dispatch'), marker: 'arrow-dispatch', cls: 'active-dispatch' },
      'RUNNING->READY': { el: document.getElementById('path-preempt'), marker: 'arrow-preempt', cls: 'active-preempt' },
      'RUNNING->WAITING': { el: document.getElementById('path-io-req'), marker: 'arrow-io-req', cls: 'active-io-req' },
      'WAITING->READY': { el: document.getElementById('path-io-done'), marker: 'arrow-io-done', cls: 'active-io-done' },
      'RUNNING->TERMINATED': { el: document.getElementById('path-exit'), marker: 'arrow-exit', cls: 'active-exit' }
    };
  }

  bindEvents() {
    // Click on node opens educational explanation
    const nodes = this.svg.querySelectorAll('.state-node-group');
    nodes.forEach(node => {
      node.addEventListener('click', () => {
        const stateKey = node.getAttribute('data-state');
        if (window.app && window.app.showStateExplanation) {
          window.app.showStateExplanation(stateKey);
        }
      });
    });
  }

  /**
   * Updates state counts and process tokens inside SVG nodes
   */
  update(simulation) {
    if (!simulation) return;

    const counts = simulation.getStateCounts();

    // Update numbers in badges
    Object.keys(counts).forEach(stateKey => {
      const badge = document.getElementById(`count-${stateKey}`);
      if (badge) {
        badge.textContent = counts[stateKey];
      }
    });

    // Update mini process pill tokens inside each node
    Object.keys(ProcessState).forEach(stateKey => {
      const tokensContainer = document.getElementById(`tokens-${stateKey}`);
      if (!tokensContainer) return;

      const procsInState = simulation.processes.filter(p => p.state === stateKey);
      tokensContainer.innerHTML = '';

      procsInState.slice(0, 4).forEach((proc, idx) => {
        const xOffset = idx * 28;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${xOffset}, 0)`);
        g.innerHTML = `
          <rect width="24" height="18" rx="6" ry="6" fill="${proc.color}" class="token-pill" />
          <text x="12" y="10" class="token-text">${proc.pid}</text>
        `;
        tokensContainer.appendChild(g);
      });

      // If more than 4, show "+N"
      if (procsInState.length > 4) {
        const extraCount = procsInState.length - 4;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', 'translate(112, 0)');
        g.innerHTML = `
          <rect width="20" height="18" rx="6" ry="6" fill="#64748b" class="token-pill" />
          <text x="10" y="10" class="token-text">+${extraCount}</text>
        `;
        tokensContainer.appendChild(g);
      }
    });
  }

  /**
   * Highlights the transition path and animates a moving particle along the route
   */
  highlightTransitions(transitions) {
    if (!transitions || transitions.length === 0) return;

    // Reset previous highlights
    this.clearHighlights();

    transitions.forEach(tr => {
      const key = `${tr.from}->${tr.to}`;
      const pathConfig = this.paths[key];
      if (!pathConfig || !pathConfig.el) return;

      const pathEl = pathConfig.el;

      // Add active styling
      pathEl.classList.add('active', pathConfig.cls);
      pathEl.setAttribute('marker-end', `url(#${pathConfig.marker})`);

      // Pulse target node
      const targetNode = document.getElementById(`node-${tr.to}`);
      if (targetNode) {
        targetNode.classList.add('active');
      }

      // Animate flowing particle along the SVG path
      this.animateParticleOnPath(pathEl, tr);
    });

    // Auto-clear highlight after 1.2s or before next tick
    this.highlightTimeout = setTimeout(() => {
      this.clearHighlights();
    }, 1200);
  }

  animateParticleOnPath(pathEl, transition) {
    const particleLayer = document.getElementById('particle-layer');
    if (!particleLayer) return;

    try {
      const pathLength = pathEl.getTotalLength();
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '6');
      circle.setAttribute('class', 'flow-particle');
      circle.setAttribute('fill', '#ffffff');
      circle.setAttribute('stroke', this.getTransitionColor(transition.from, transition.to));
      circle.setAttribute('stroke-width', '3');

      particleLayer.appendChild(circle);

      const duration = 750; // ms
      const startTime = performance.now();

      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const point = pathEl.getPointAtLength(progress * pathLength);

        circle.setAttribute('cx', point.x);
        circle.setAttribute('cy', point.y);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          if (circle.parentNode) {
            circle.parentNode.removeChild(circle);
          }
        }
      }

      requestAnimationFrame(step);
    } catch (err) {
      console.warn('Particle animation skipped:', err);
    }
  }

  getTransitionColor(from, to) {
    if (from === 'NEW' && to === 'READY') return '#9333ea';
    if (from === 'READY' && to === 'RUNNING') return '#16a34a';
    if (from === 'RUNNING' && to === 'READY') return '#2563eb';
    if (from === 'RUNNING' && to === 'WAITING') return '#ea580c';
    if (from === 'WAITING' && to === 'READY') return '#3b82f6';
    if (from === 'RUNNING' && to === 'TERMINATED') return '#ef4444';
    return '#64748b';
  }

  clearHighlights() {
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
      this.highlightTimeout = null;
    }

    Object.values(this.paths).forEach(p => {
      if (p.el) {
        p.el.className.baseVal = 'transition-path';
        p.el.setAttribute('marker-end', 'url(#arrow-default)');
      }
    });

    document.querySelectorAll('.state-node-group').forEach(node => {
      node.classList.remove('active');
    });

    const particleLayer = document.getElementById('particle-layer');
    if (particleLayer) {
      particleLayer.innerHTML = '';
    }
  }
}

