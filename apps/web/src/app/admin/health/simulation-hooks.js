/* src/app/admin/health/simulation-hooks.js */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getOrchestrator, formatSimDuration } from './simulation-engine';

/* ─── useLiveMetrics ───
   Subscribe to real-time simulation data and return live metrics
   for all services or a specific service.
*/
export function useLiveMetrics(options = {}) {
  const {
    serviceId = null,      // null = all services
    refreshRate = 1000,    // UI refresh rate (may differ from sim tick)
    includeHistory = true, // Include metric history arrays
  } = options;

  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const unsubscribeRef = useRef(null);
  const orchestratorRef = useRef(null);

  useEffect(() => {
    const orchestrator = getOrchestrator();
    orchestratorRef.current = orchestrator;

    // Start simulation if not running
    if (!orchestrator.isRunning) {
      orchestrator.start();
    }

    setIsConnected(true);

    // Subscribe to updates
    const unsubscribe = orchestrator.subscribe((overview) => {
      if (serviceId) {
        const svc = overview.snapshots?.[serviceId];
        setData(svc ? { ...svc, systemStatus: overview.status, timestamp: overview.timestamp } : null);
      } else {
        setData(overview);
      }
      setLastUpdate(new Date());
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [serviceId]);

  // Periodic heartbeat for connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const orch = orchestratorRef.current;
      if (orch) {
        setIsConnected(orch.isRunning);
      }
    }, refreshRate);
    return () => clearInterval(interval);
  }, [refreshRate]);

  const stats = useMemo(() => {
    const orch = orchestratorRef.current;
    return orch ? orch.getStats() : null;
  }, [lastUpdate]);

  return {
    data,
    isConnected,
    lastUpdate,
    stats,
    orchestrator: orchestratorRef.current,
  };
}

/* ─── useTrafficSimulator ───
   Controls for the traffic simulation (patterns, stress, events)
*/
export function useTrafficSimulator() {
  const orchestratorRef = useRef(null);
  const [controls, setControls] = useState({
    pattern: 'rushHour',
    stress: 0,
    isRunning: false,
    elapsed: 0,
  });

  useEffect(() => {
    orchestratorRef.current = getOrchestrator();
    const orch = orchestratorRef.current;

    // Sync initial state
    setControls({
      pattern: orch.trafficPattern,
      stress: orch.globalStress,
      isRunning: orch.isRunning,
      elapsed: 0,
    });

    // Poll for status updates
    const interval = setInterval(() => {
      const stats = orch.getStats();
      setControls(prev => ({
        ...prev,
        isRunning: stats.isRunning,
        elapsed: stats.elapsed,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const setPattern = useCallback((pattern) => {
    const orch = orchestratorRef.current;
    if (orch) {
      orch.setTrafficPattern(pattern);
      setControls(prev => ({ ...prev, pattern }));
    }
  }, []);

  const setStress = useCallback((level) => {
    const orch = orchestratorRef.current;
    if (orch) {
      orch.setGlobalStress(level);
      setControls(prev => ({ ...prev, stress: level }));
    }
  }, []);

  const triggerSpike = useCallback(() => {
    const orch = orchestratorRef.current;
    if (orch) {
      orch.triggerSpike();
      setControls(prev => ({ ...prev, pattern: 'spike' }));
    }
  }, []);

  const triggerRamp = useCallback(() => {
    const orch = orchestratorRef.current;
    if (orch) {
      orch.triggerRamp();
      setControls(prev => ({ ...prev, pattern: 'ramp' }));
    }
  }, []);

  const triggerDDoS = useCallback(() => {
    const orch = orchestratorRef.current;
    if (orch) {
      orch.triggerDDoS();
      setControls(prev => ({ ...prev, pattern: 'erratic', stress: 1.5 }));
    }
  }, []);

  const start = useCallback(() => {
    const orch = orchestratorRef.current;
    if (orch) {
      orch.start();
      setControls(prev => ({ ...prev, isRunning: true }));
    }
  }, []);

  const stop = useCallback(() => {
    const orch = orchestratorRef.current;
    if (orch) {
      orch.stop();
      setControls(prev => ({ ...prev, isRunning: false }));
    }
  }, []);

  const toggle = useCallback(() => {
    const orch = orchestratorRef.current;
    if (orch) {
      if (orch.isRunning) {
        orch.stop();
        setControls(prev => ({ ...prev, isRunning: false }));
      } else {
        orch.start();
        setControls(prev => ({ ...prev, isRunning: true }));
      }
    }
  }, []);

  const formattedElapsed = useMemo(() => {
    return formatSimDuration(controls.elapsed);
  }, [controls.elapsed]);

  return {
    ...controls,
    formattedElapsed,
    setPattern,
    setStress,
    triggerSpike,
    triggerRamp,
    triggerDDoS,
    start,
    stop,
    toggle,
  };
}

/* ─── useSimulatedErrors ───
   Subscribe to synthetic error events generated by the simulation
*/
export function useSimulatedErrors(options = {}) {
  const { severity = null, service = null, limit = 50 } = options;
  const [events, setEvents] = useState([]);
  const orchRef = useRef(null);

  useEffect(() => {
    const orch = getOrchestrator();
    orchRef.current = orch;

    // Poll for events
    const interval = setInterval(() => {
      const filter = {};
      if (severity) filter.severity = severity;
      if (service) filter.service = service;
      const newEvents = orch.getEvents(filter).slice(0, limit);
      setEvents(newEvents);
    }, 500);

    return () => clearInterval(interval);
  }, [severity, service, limit]);

  const clearEvents = useCallback(() => {
    // Events are auto-capped by the orchestrator, but we can
    // provide a client-side clear for the UI
    setEvents([]);
  }, []);

  return { events, clearEvents };
}

/* ─── useServiceHistory ───
   Get historical metric data for a specific service for charting
*/
export function useServiceHistory(serviceId, metric = 'latency', points = 60) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const orch = getOrchestrator();
    const interval = setInterval(() => {
      const snapshot = orch.getServiceSnapshot(serviceId);
      if (snapshot?.history?.[metric]) {
        const data = snapshot.history[metric]
          .slice(-points)
          .map((p, i) => ({
            time: new Date(p.timestamp).toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            value: p.value,
            index: i,
          }));
        setHistory(data);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [serviceId, metric, points]);

  return history;
}

/* ─── useLiveLatencyChart ───
   Optimized hook for latency chart data across all services
*/
export function useLiveLatencyChart(points = 30) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const orch = getOrchestrator();
    const interval = setInterval(() => {
      const overview = orch.getSystemOverview();
      const snapshots = overview.snapshots || {};

      const newPoint = {
        time: new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      Object.entries(snapshots).forEach(([id, snap]) => {
        const metric = snap.metrics?.latency;
        if (metric) {
          // Map service IDs to chart-friendly names
          const nameMap = {
            'svc-api': 'API Gateway',
            'svc-auth': 'Auth Service',
            'svc-db': 'Database',
            'svc-cache': 'Redis Cache',
            'svc-worker': 'Worker',
            'svc-storage': 'File Storage',
            'svc-search': 'Search Index',
            'svc-notify': 'Notifications',
          };
          newPoint[nameMap[id] || id] = Math.round(metric.value);
        }
      });

      setChartData(prev => {
        const next = [...prev, newPoint];
        if (next.length > points) next.shift();
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [points]);

  return chartData;
}

/* ─── useSystemHealth ───
   High-level system health status with trend analysis
*/
export function useSystemHealth() {
  const { data, isConnected } = useLiveMetrics();
  const [trend, setTrend] = useState({ direction: 'stable', change: 0 });
  const historyRef = useRef([]);

  useEffect(() => {
    if (data?.metrics?.avgLatency) {
      historyRef.current.push({
        timestamp: Date.now(),
        latency: data.metrics.avgLatency,
        errorRate: data.metrics.avgErrorRate,
      });

      if (historyRef.current.length > 20) {
        historyRef.current.shift();
      }

      // Calculate trend
      if (historyRef.current.length >= 5) {
        const recent = historyRef.current.slice(-5);
        const older = historyRef.current.slice(0, 5);
        const recentAvg = recent.reduce((s, p) => s + p.latency, 0) / recent.length;
        const olderAvg = older.reduce((s, p) => s + p.latency, 0) / older.length;

        const change = olderAvg === 0 ? 0 : ((recentAvg - olderAvg) / olderAvg) * 100;
        let direction = 'stable';
        if (change > 5) direction = 'worsening';
        else if (change < -5) direction = 'improving';

        setTrend({ direction, change: Math.round(change * 10) / 10 });
      }
    }
  }, [data]);

  return {
    status: data?.status || 'unknown',
    metrics: data?.metrics || {},
    services: data?.services || {},
    isConnected,
    trend,
    history: historyRef.current,
  };
}
