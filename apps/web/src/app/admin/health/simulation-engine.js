/* src/app/admin/health/simulation-engine.js */

/**
 * Real-Time Simulation Engine
 * Generates live metrics, simulates traffic patterns, and produces realistic
 * system events for the System Health dashboard.
 */

/* ─── Constants ─── */
const SIMULATION_TICK = 1000; // 1 second base tick
const METRIC_HISTORY_LIMIT = 60; // Keep last 60 data points

/* ─── Traffic Pattern Generators ─── */

export const TrafficPatterns = {
  /** Normal business hours traffic */
  steady: (time) => {
    const hour = time.getHours();
    const base = hour >= 9 && hour <= 17 ? 0.7 : 0.3;
    return base + (Math.random() - 0.5) * 0.1;
  },

  /** Morning rush + evening taper */
  rushHour: (time) => {
    const hour = time.getHours();
    let base = 0.3;
    if (hour >= 7 && hour <= 9) base = 0.9;
    else if (hour >= 10 && hour <= 12) base = 0.75;
    else if (hour >= 13 && hour <= 15) base = 0.85;
    else if (hour >= 16 && hour <= 18) base = 0.7;
    else if (hour >= 19 && hour <= 22) base = 0.5;
    return base + (Math.random() - 0.5) * 0.15;
  },

  /** Spike then normalize (marketing campaign, viral event) */
  spike: (time, spikeStart = null, spikeDuration = 300000) => {
    const now = time.getTime();
    if (spikeStart && now - spikeStart < spikeDuration) {
      const progress = (now - spikeStart) / spikeDuration;
      const intensity = Math.sin(progress * Math.PI); // bell curve
      return 0.3 + intensity * 0.8 + (Math.random() - 0.5) * 0.1;
    }
    return 0.3 + (Math.random() - 0.5) * 0.1;
  },

  /** Gradual ramp up (product launch, onboarding wave) */
  ramp: (time, rampStart = null, rampDuration = 600000) => {
    const now = time.getTime();
    if (rampStart && now - rampStart < rampDuration) {
      const progress = Math.min(1, (now - rampStart) / rampDuration);
      return 0.2 + progress * 0.6 + (Math.random() - 0.5) * 0.1;
    }
    return 0.8 + (Math.random() - 0.5) * 0.1;
  },

  /** Erratic / DDoS-like pattern */
  erratic: (time) => {
    const burst = Math.random() > 0.85 ? Math.random() * 0.6 : 0;
    return 0.2 + burst + (Math.random() - 0.5) * 0.2;
  },
};

/* ─── Metric Generators ─── */

class MetricGenerator {
  constructor(config) {
    this.config = {
      baseValue: 50,
      variance: 10,
      trend: 0,
      seasonality: 0,
      noise: 5,
      min: 0,
      max: 100,
      unit: '',
      ...config,
    };
    this.history = [];
    this.tickCount = 0;
  }

  generate(trafficLoad = 0.5) {
    this.tickCount++;
    const c = this.config;

    // Base + trend
    let value = c.baseValue + c.trend * this.tickCount;

    // Traffic load impact
    value += trafficLoad * c.variance * 2;

    // Seasonality (sine wave)
    if (c.seasonality > 0) {
      value += Math.sin(this.tickCount * 0.1) * c.seasonality;
    }

    // Random noise
    value += (Math.random() - 0.5) * c.noise * 2;

    // Clamp
    value = Math.max(c.min, Math.min(c.max, value));

    const point = {
      timestamp: new Date().toISOString(),
      value: Math.round(value * 100) / 100,
      unit: c.unit,
    };

    this.history.push(point);
    if (this.history.length > METRIC_HISTORY_LIMIT) {
      this.history.shift();
    }

    return point;
  }

  getHistory() {
    return [...this.history];
  }

  getLatest() {
    return this.history[this.history.length - 1] || null;
  }

  getAverage(window = 10) {
    const recent = this.history.slice(-window);
    if (recent.length === 0) return 0;
    return recent.reduce((s, p) => s + p.value, 0) / recent.length;
  }

  getTrend() {
    if (this.history.length < 2) return 0;
    const recent = this.history.slice(-10);
    const first = recent[0]?.value || 0;
    const last = recent[recent.length - 1]?.value || 0;
    return first === 0 ? 0 : ((last - first) / first) * 100;
  }
}

/* ─── Service Simulator ─── */

export class ServiceSimulator {
  constructor(serviceConfig) {
    this.id = serviceConfig.id;
    this.name = serviceConfig.name;
    this.config = serviceConfig;
    this.status = 'operational';
    this.metrics = {};
    this.incidents = [];
    this.errorRate = 0;
    this.uptime = 99.99;
    this.lastIncident = null;

    // Initialize metric generators
    this.metrics.latency = new MetricGenerator({
      baseValue: serviceConfig.baseLatency || 40,
      variance: 20,
      noise: 8,
      min: 2,
      max: 5000,
      unit: 'ms',
    });

    this.metrics.throughput = new MetricGenerator({
      baseValue: serviceConfig.baseThroughput || 1000,
      variance: 300,
      noise: 100,
      min: 0,
      max: 10000,
      unit: 'req/min',
    });

    this.metrics.errorRate = new MetricGenerator({
      baseValue: 0.1,
      variance: 0.5,
      noise: 0.2,
      min: 0,
      max: 100,
      unit: '%',
    });

    this.metrics.cpu = new MetricGenerator({
      baseValue: 25,
      variance: 15,
      noise: 5,
      min: 0,
      max: 100,
      unit: '%',
    });

    this.metrics.memory = new MetricGenerator({
      baseValue: 45,
      variance: 10,
      noise: 3,
      min: 0,
      max: 100,
      unit: '%',
    });
  }

  tick(trafficLoad = 0.5, globalStress = 0) {
    // Apply stress multiplier
    const stressedLoad = Math.min(1, trafficLoad * (1 + globalStress));

    // Generate metrics
    const latency = this.metrics.latency.generate(stressedLoad);
    const throughput = this.metrics.throughput.generate(stressedLoad);
    const errorRate = this.metrics.errorRate.generate(stressedLoad * stressedLoad); // errors compound
    const cpu = this.metrics.cpu.generate(stressedLoad);
    const memory = this.metrics.memory.generate(stressedLoad * 0.8);

    // Determine status based on metrics
    const prevStatus = this.status;
    this.status = this._determineStatus(latency.value, errorRate.value, cpu.value, memory.value);

    // Track incidents
    if (prevStatus === 'operational' && this.status !== 'operational') {
      this._startIncident(this.status);
    } else if (prevStatus !== 'operational' && this.status === 'operational') {
      this._resolveIncident();
    }

    // Update uptime
    if (this.status === 'operational') {
      this.uptime = Math.min(99.999, this.uptime + 0.001);
    } else {
      this.uptime = Math.max(99.0, this.uptime - 0.01);
    }

    this.errorRate = errorRate.value;

    return {
      id: this.id,
      name: this.name,
      status: this.status,
      latency: {
        current: Math.round(latency.value),
        p95: Math.round(latency.value * 1.5 + Math.random() * 20),
        p99: Math.round(latency.value * 2.2 + Math.random() * 50),
      },
      throughput: Math.round(throughput.value),
      errorRate: Math.round(errorRate.value * 100) / 100,
      cpu: Math.round(cpu.value * 10) / 10,
      memory: Math.round(memory.value * 10) / 10,
      uptime: this.uptime.toFixed(2) + '%',
      timestamp: new Date().toISOString(),
    };
  }

  _determineStatus(latency, errorRate, cpu, memory) {
    if (latency > 2000 || errorRate > 5 || cpu > 95 || memory > 95) return 'critical';
    if (latency > 500 || errorRate > 1 || cpu > 80 || memory > 85) return 'degraded';
    return 'operational';
  }

  _startIncident(severity) {
    const incident = {
      id: `INC-${Date.now()}-${this.id}`,
      serviceId: this.id,
      serviceName: this.name,
      severity,
      startedAt: new Date().toISOString(),
      resolvedAt: null,
      duration: 0,
    };
    this.incidents.push(incident);
    this.lastIncident = incident;
  }

  _resolveIncident() {
    const active = this.incidents.find(i => !i.resolvedAt);
    if (active) {
      active.resolvedAt = new Date().toISOString();
      const start = new Date(active.startedAt);
      const end = new Date(active.resolvedAt);
      active.duration = Math.round((end - start) / 1000);
    }
  }

  getSnapshot() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      uptime: this.uptime.toFixed(2) + '%',
      errorRate: this.errorRate,
      lastIncident: this.lastIncident,
      incidentCount: this.incidents.length,
      metrics: {
        latency: this.metrics.latency.getLatest(),
        throughput: this.metrics.throughput.getLatest(),
        errorRate: this.metrics.errorRate.getLatest(),
        cpu: this.metrics.cpu.getLatest(),
        memory: this.metrics.memory.getLatest(),
      },
      history: {
        latency: this.metrics.latency.getHistory(),
        throughput: this.metrics.throughput.getHistory(),
        errorRate: this.metrics.errorRate.getHistory(),
        cpu: this.metrics.cpu.getHistory(),
        memory: this.metrics.memory.getHistory(),
      },
    };
  }
}

/* ─── Simulation Orchestrator ─── */

export class SimulationOrchestrator {
  constructor() {
    this.services = new Map();
    this.trafficPattern = 'rushHour';
    this.trafficLoad = 0.5;
    this.globalStress = 0;
    this.isRunning = false;
    this.tickInterval = null;
    this.listeners = new Set();
    this.eventLog = [];
    this.maxEvents = 100;
    this.startTime = null;
    this.spikeStart = null;
    this.rampStart = null;

    // Default services
    this._initDefaultServices();
  }

  _initDefaultServices() {
    const configs = [
      { id: 'svc-api', name: 'API Gateway', baseLatency: 45, baseThroughput: 2800 },
      { id: 'svc-auth', name: 'Auth Service', baseLatency: 28, baseThroughput: 1500 },
      { id: 'svc-db', name: 'Primary Database', baseLatency: 8, baseThroughput: 500 },
      { id: 'svc-cache', name: 'Redis Cache', baseLatency: 2, baseThroughput: 8000 },
      { id: 'svc-worker', name: 'Background Worker', baseLatency: 1200, baseThroughput: 45 },
      { id: 'svc-storage', name: 'File Storage (S3)', baseLatency: 35, baseThroughput: 2000 },
      { id: 'svc-search', name: 'Search Index', baseLatency: 18, baseThroughput: 1500 },
      { id: 'svc-notify', name: 'Notification Service', baseLatency: 55, baseThroughput: 900 },
    ];

    configs.forEach(cfg => {
      this.services.set(cfg.id, new ServiceSimulator(cfg));
    });
  }

  /* ─── Control Methods ─── */

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = Date.now();

    this.tickInterval = setInterval(() => {
      this._tick();
    }, SIMULATION_TICK);

    this._logEvent('info', 'Simulation started', { pattern: this.trafficPattern });
  }

  stop() {
    this.isRunning = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this._logEvent('info', 'Simulation stopped');
  }

  pause() {
    this.isRunning = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this._logEvent('info', 'Simulation paused');
  }

  resume() {
    if (!this.isRunning) {
      this.start();
      this._logEvent('info', 'Simulation resumed');
    }
  }

  /* ─── Configuration ─── */

  setTrafficPattern(pattern) {
    this.trafficPattern = pattern;
    this._logEvent('info', `Traffic pattern changed to ${pattern}`);
  }

  setGlobalStress(level) {
    this.globalStress = Math.max(0, Math.min(2, level));
    this._logEvent('warning', `Global stress level set to ${(this.globalStress * 100).toFixed(0)}%`);
  }

  triggerSpike() {
    this.spikeStart = Date.now();
    this.trafficPattern = 'spike';
    this._logEvent('danger', 'Traffic spike triggered!');
    // Auto-reset after 5 minutes
    setTimeout(() => {
      this.trafficPattern = 'rushHour';
      this.spikeStart = null;
      this._logEvent('info', 'Traffic spike ended, returning to normal');
    }, 300000);
  }

  triggerRamp() {
    this.rampStart = Date.now();
    this.trafficPattern = 'ramp';
    this._logEvent('warning', 'Traffic ramp started');
    setTimeout(() => {
      this.trafficPattern = 'rushHour';
      this.rampStart = null;
      this._logEvent('info', 'Traffic ramp completed');
    }, 600000);
  }

  triggerDDoS() {
    this.trafficPattern = 'erratic';
    this.globalStress = 1.5;
    this._logEvent('critical', 'DDoS attack simulation started!');
    setTimeout(() => {
      this.trafficPattern = 'rushHour';
      this.globalStress = 0;
      this._logEvent('info', 'DDoS simulation ended');
    }, 120000);
  }

  /* ─── Tick Logic ─── */

  _tick() {
    const now = new Date();
    const patternFn = TrafficPatterns[this.trafficPattern] || TrafficPatterns.steady;
    this.trafficLoad = patternFn(now, this.spikeStart, this.rampStart);

    const results = {
      timestamp: now.toISOString(),
      trafficLoad: this.trafficLoad,
      globalStress: this.globalStress,
      services: {},
      systemStatus: 'healthy',
    };

    let criticalCount = 0;
    let degradedCount = 0;

    this.services.forEach((simulator, id) => {
      const data = simulator.tick(this.trafficLoad, this.globalStress);
      results.services[id] = data;

      if (data.status === 'critical') criticalCount++;
      else if (data.status === 'degraded') degradedCount++;
    });

    // Determine system status
    if (criticalCount > 0) results.systemStatus = 'critical';
    else if (degradedCount > 0) results.systemStatus = 'degraded';
    else if (degradedCount > 2) results.systemStatus = 'degraded';

    // Auto-generate errors based on conditions
    this._generateSyntheticErrors(results);

    this._notifyListeners(results);
  }

  _generateSyntheticErrors(results) {
    // Occasionally generate errors for degraded/critical services
    Object.values(results.services).forEach(svc => {
      if (svc.status !== 'operational' && Math.random() > 0.7) {
        const errorTypes = [
          { severity: svc.status === 'critical' ? 'critical' : 'warning', message: `Elevated latency on ${svc.name}: ${svc.latency.current}ms` },
          { severity: 'warning', message: `High error rate detected on ${svc.name}: ${svc.errorRate}%` },
          { severity: 'error', message: `Connection timeout on ${svc.name}` },
          { severity: 'warning', message: `Memory pressure on ${svc.name}: ${svc.memory}%` },
        ];
        const err = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        this._logEvent(err.severity, err.message, { service: svc.id, metric: svc });
      }
    });
  }

  /* ─── Event Logging ─── */

  _logEvent(severity, message, metadata = {}) {
    const event = {
      id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      severity,
      message,
      ...metadata,
    };

    this.eventLog.unshift(event);
    if (this.eventLog.length > this.maxEvents) {
      this.eventLog.pop();
    }
  }

  getEvents(filter = null) {
    if (!filter) return [...this.eventLog];
    return this.eventLog.filter(e => {
      if (filter.severity && e.severity !== filter.severity) return false;
      if (filter.service && e.service !== filter.service) return false;
      if (filter.since && new Date(e.timestamp) < new Date(filter.since)) return false;
      return true;
    });
  }

  /* ─── Data Access ─── */

  getServiceSnapshot(serviceId) {
    const svc = this.services.get(serviceId);
    return svc ? svc.getSnapshot() : null;
  }

  getAllSnapshots() {
    const snapshots = {};
    this.services.forEach((sim, id) => {
      snapshots[id] = sim.getSnapshot();
    });
    return snapshots;
  }

  getSystemOverview() {
    const snapshots = this.getAllSnapshots();
    const services = Object.values(snapshots);
    const operational = services.filter(s => s.status === 'operational').length;
    const degraded = services.filter(s => s.status === 'degraded').length;
    const critical = services.filter(s => s.status === 'critical').length;

    const avgLatency = services.reduce((s, svc) => s + (svc.metrics.latency?.value || 0), 0) / services.length;
    const totalThroughput = services.reduce((s, svc) => s + (svc.metrics.throughput?.value || 0), 0);
    const avgErrorRate = services.reduce((s, svc) => s + (svc.metrics.errorRate?.value || 0), 0) / services.length;

    return {
      status: critical > 0 ? 'critical' : degraded > 0 ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        current: (services.reduce((s, svc) => s + parseFloat(svc.uptime), 0) / services.length).toFixed(2) + '%',
      },
      services: { operational, degraded, critical, total: services.length },
      metrics: {
        avgLatency: Math.round(avgLatency),
        totalThroughput: Math.round(totalThroughput),
        avgErrorRate: Math.round(avgErrorRate * 1000) / 1000,
        trafficLoad: Math.round(this.trafficLoad * 100),
      },
      snapshots,
    };
  }

  /* ─── Listener Pattern ─── */

  subscribe(callback) {
    this.listeners.add(callback);
    // Immediately send current state
    const current = this.getSystemOverview();
    callback(current);
    return () => this.listeners.delete(callback);
  }

  _notifyListeners(data) {
    this.listeners.forEach(cb => {
      try { cb(data); } catch (e) { console.error('Simulation listener error:', e); }
    });
  }

  /* ─── Stats ─── */

  getStats() {
    const elapsed = this.startTime ? Date.now() - this.startTime : 0;
    return {
      isRunning: this.isRunning,
      elapsed: Math.round(elapsed / 1000),
      tickRate: SIMULATION_TICK,
      trafficPattern: this.trafficPattern,
      globalStress: this.globalStress,
      listenerCount: this.listeners.size,
      eventCount: this.eventLog.length,
      serviceCount: this.services.size,
    };
  }
}

/* ─── Singleton Instance ─── */
let globalOrchestrator = null;

export function getOrchestrator() {
  if (!globalOrchestrator) {
    globalOrchestrator = new SimulationOrchestrator();
  }
  return globalOrchestrator;
}

export function resetOrchestrator() {
  if (globalOrchestrator) {
    globalOrchestrator.stop();
  }
  globalOrchestrator = new SimulationOrchestrator();
  return globalOrchestrator;
}

/* ─── Utility: Format duration ─── */
export function formatSimDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

/* ─── Utility: Generate traffic visualization data ─── */
export function generateTrafficVizData(history, buckets = 20) {
  if (history.length === 0) return [];
  const bucketSize = Math.ceil(history.length / buckets);
  const result = [];

  for (let i = 0; i < history.length; i += bucketSize) {
    const slice = history.slice(i, i + bucketSize);
    const avg = slice.reduce((s, p) => s + p.value, 0) / slice.length;
    result.push({
      index: i / bucketSize,
      avg: Math.round(avg * 100) / 100,
      min: Math.min(...slice.map(p => p.value)),
      max: Math.max(...slice.map(p => p.value)),
      count: slice.length,
    });
  }

  return result;
}
