import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { SystemMetrics, TimeSeriesPoint, Alert, AlertRule, CronJob } from '../types';

function generateHistory(base: number, variance: number, points = 20): TimeSeriesPoint[] {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    time: new Date(now - (points - i) * 5000).toISOString(),
    value: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance * 2)),
  }));
}

function generateNetworkHistory(points = 20) {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    time: new Date(now - (points - i) * 5000).toISOString(),
    rx: Math.random() * 80 + 20,
    tx: Math.random() * 40 + 5,
  }));
}

function buildMetrics(): SystemMetrics {
  return {
    cpu: {
      usage: 42 + Math.random() * 20,
      cores: 16,
      model: 'AMD Ryzen 9 5950X 16-Core',
      frequency: 3.4 + Math.random() * 1.2,
      history: generateHistory(45, 25),
      perCore: Array.from({ length: 16 }, () => Math.random() * 80 + 10),
    },
    memory: {
      total: 32 * 1024,
      used: 18432 + Math.random() * 2048,
      free: 8192,
      cached: 4096,
      buffers: 1024,
      usage: 62 + Math.random() * 10,
      history: generateHistory(64, 15),
    },
    swap: {
      total: 8 * 1024,
      used: 512 + Math.random() * 256,
      free: 7680,
      usage: 8,
    },
    disk: [
      { device: '/dev/nvme0n1p2', mountpoint: '/', fstype: 'ext4', total: 500 * 1024, used: 220 * 1024, free: 280 * 1024, usage: 44, readSpeed: 450 + Math.random() * 100, writeSpeed: 200 + Math.random() * 100 },
      { device: '/dev/sda1', mountpoint: '/data', fstype: 'xfs', total: 2 * 1024 * 1024, used: 800 * 1024, free: 1224 * 1024, usage: 38, readSpeed: 150 + Math.random() * 50, writeSpeed: 80 + Math.random() * 30 },
      { device: '/dev/sdb1', mountpoint: '/backup', fstype: 'ext4', total: 4 * 1024 * 1024, used: 3200 * 1024, free: 824 * 1024, usage: 80, readSpeed: 120, writeSpeed: 60 },
    ],
    network: {
      interfaces: [
        { name: 'eth0', rx: 1.2e9, tx: 320e6, rxRate: 85 + Math.random() * 40, txRate: 22 + Math.random() * 15, ip: '192.168.1.100', mac: '00:1A:2B:3C:4D:5E' },
        { name: 'eth1', rx: 500e6, tx: 150e6, rxRate: 12 + Math.random() * 8, txRate: 5 + Math.random() * 4, ip: '10.0.0.1', mac: '00:1A:2B:3C:4D:5F' },
      ],
      totalRx: 1.7e9,
      totalTx: 470e6,
      history: generateNetworkHistory(),
    },
    load: {
      load1: 1.8 + Math.random() * 2,
      load5: 2.1 + Math.random() * 1,
      load15: 1.9 + Math.random() * 0.5,
      history: generateHistory(35, 20),
    },
    uptime: 1209600 + Math.floor(Math.random() * 3600),
    hostname: 'prod-server-01',
    os: 'Ubuntu 24.04.1 LTS',
    kernel: '6.8.0-51-generic',
    temperatures: [
      { sensor: 'CPU Package', temperature: 52 + Math.random() * 15, high: 80, critical: 95 },
      { sensor: 'CPU Core 0', temperature: 48 + Math.random() * 12, high: 80, critical: 95 },
      { sensor: 'NVMe Composite', temperature: 38 + Math.random() * 8, high: 75, critical: 85 },
      { sensor: 'MB Temp', temperature: 32 + Math.random() * 6, high: 60, critical: 75 },
    ],
    processes: [
      { pid: 1245, name: 'postgres', user: 'postgres', cpu: 8.2, memory: 4.1, status: 'S', started: '2d ago' },
      { pid: 2380, name: 'nginx', user: 'www-data', cpu: 1.4, memory: 0.3, status: 'S', started: '2d ago' },
      { pid: 3891, name: 'node', user: 'app', cpu: 12.8, memory: 8.7, status: 'S', started: '4h ago' },
      { pid: 4120, name: 'python3', user: 'worker', cpu: 22.1, memory: 3.2, status: 'R', started: '1h ago' },
      { pid: 5002, name: 'redis-server', user: 'redis', cpu: 0.8, memory: 1.2, status: 'S', started: '2d ago' },
      { pid: 6541, name: 'docker', user: 'root', cpu: 3.2, memory: 2.1, status: 'S', started: '2d ago' },
      { pid: 7823, name: 'prometheus', user: 'prometheus', cpu: 1.9, memory: 5.4, status: 'S', started: '2d ago' },
    ],
    users: [
      { user: 'admin', tty: 'pts/0', from: '192.168.1.50', loginTime: '09:32' },
      { user: 'deploy', tty: 'pts/1', from: '10.0.0.12', loginTime: '11:15' },
      { user: 'root', tty: 'pts/2', from: '192.168.1.100', loginTime: '14:02' },
    ],
    services: [
      { name: 'nginx', status: 'active', enabled: true, description: 'A high performance web server', since: '2d ago' },
      { name: 'postgresql', status: 'active', enabled: true, description: 'PostgreSQL Database Server', since: '2d ago' },
      { name: 'redis', status: 'active', enabled: true, description: 'Advanced key-value store', since: '2d ago' },
      { name: 'docker', status: 'active', enabled: true, description: 'Docker Application Container Engine', since: '2d ago' },
      { name: 'ssh', status: 'active', enabled: true, description: 'OpenBSD Secure Shell server', since: '14d ago' },
      { name: 'fail2ban', status: 'active', enabled: true, description: 'Fail2Ban Service', since: '2d ago' },
      { name: 'ufw', status: 'active', enabled: true, description: 'Uncomplicated Firewall', since: '14d ago' },
      { name: 'cron', status: 'active', enabled: true, description: 'Regular background program processing', since: '14d ago' },
      { name: 'snapd', status: 'inactive', enabled: false, description: 'Snappy daemon', since: '—' },
    ],
    docker: [
      { id: 'a1b2c3d4e5f6', name: 'web-app', image: 'node:20-alpine', status: 'running', ports: ['80:3000', '443:3443'], cpu: 3.2, memory: 512, created: '2d ago', uptime: '2 days' },
      { id: 'b2c3d4e5f6a1', name: 'postgres-db', image: 'postgres:16', status: 'running', ports: ['5432:5432'], cpu: 1.1, memory: 768, created: '2d ago', uptime: '2 days' },
      { id: 'c3d4e5f6a1b2', name: 'redis-cache', image: 'redis:7-alpine', status: 'running', ports: ['6379:6379'], cpu: 0.2, memory: 64, created: '2d ago', uptime: '2 days' },
      { id: 'd4e5f6a1b2c3', name: 'nginx-proxy', image: 'nginx:latest', status: 'running', ports: ['80:80', '443:443'], cpu: 0.4, memory: 32, created: '2d ago', uptime: '2 days' },
      { id: 'e5f6a1b2c3d4', name: 'worker-queue', image: 'python:3.12-slim', status: 'stopped', ports: [], cpu: 0, memory: 0, created: '3d ago', uptime: '—' },
      { id: 'f6a1b2c3d4e5', name: 'monitoring', image: 'grafana/grafana:latest', status: 'running', ports: ['3000:3000'], cpu: 1.8, memory: 256, created: '5d ago', uptime: '5 days' },
    ],
  };
}

const mockAlerts: Alert[] = [
  { id: '1', type: 'disk', severity: 'warning', title: 'Low Disk Space', message: '/backup is 80% full (3.2 GB / 4.0 GB used)', timestamp: new Date(Date.now() - 3600000).toISOString(), resolved: false, server: 'prod-server-01' },
  { id: '2', type: 'cpu', severity: 'warning', title: 'High CPU Usage', message: 'CPU usage exceeded 85% threshold for 5 minutes', timestamp: new Date(Date.now() - 7200000).toISOString(), resolved: true, server: 'prod-server-01' },
  { id: '3', type: 'docker', severity: 'critical', title: 'Container Stopped', message: 'Container worker-queue has stopped unexpectedly', timestamp: new Date(Date.now() - 1800000).toISOString(), resolved: false, server: 'prod-server-01' },
  { id: '4', type: 'service', severity: 'info', title: 'Service Restarted', message: 'nginx was restarted successfully', timestamp: new Date(Date.now() - 86400000).toISOString(), resolved: true, server: 'prod-server-01' },
];

const mockAlertRules: AlertRule[] = [
  { id: '1', type: 'cpu', enabled: true, threshold: 85, duration: 5, notifyEmail: true, notifyPush: true, description: 'Alert when CPU usage exceeds threshold' },
  { id: '2', type: 'memory', enabled: true, threshold: 90, duration: 2, notifyEmail: true, notifyPush: true, description: 'Alert when memory usage is critical' },
  { id: '3', type: 'disk', enabled: true, threshold: 80, duration: 0, notifyEmail: true, notifyPush: false, description: 'Alert when any disk exceeds usage threshold' },
  { id: '4', type: 'service', enabled: true, threshold: 0, duration: 0, notifyEmail: true, notifyPush: true, description: 'Alert when a monitored service stops' },
  { id: '5', type: 'docker', enabled: true, threshold: 0, duration: 0, notifyEmail: false, notifyPush: true, description: 'Alert when a container exits unexpectedly' },
];

const mockCronJobs: CronJob[] = [
  { id: '1', name: 'Database Backup', schedule: '0 2 * * *', command: '/usr/local/bin/backup-db.sh', user: 'root', enabled: true, lastRun: new Date(Date.now() - 72000000).toISOString(), nextRun: new Date(Date.now() + 14400000).toISOString(), lastStatus: 'success', description: 'Full database backup to /backup' },
  { id: '2', name: 'Log Rotation', schedule: '0 0 * * 0', command: '/usr/sbin/logrotate /etc/logrotate.conf', user: 'root', enabled: true, lastRun: new Date(Date.now() - 604800000).toISOString(), nextRun: new Date(Date.now() + 172800000).toISOString(), lastStatus: 'success', description: 'Weekly log rotation' },
  { id: '3', name: 'SSL Cert Renewal', schedule: '0 12 * * *', command: 'certbot renew --quiet', user: 'root', enabled: true, lastRun: new Date(Date.now() - 86400000).toISOString(), nextRun: new Date(Date.now() + 86400000).toISOString(), lastStatus: 'success', description: 'Automatic SSL certificate renewal' },
  { id: '4', name: 'Cache Cleanup', schedule: '*/30 * * * *', command: '/usr/local/bin/clear-cache.sh', user: 'app', enabled: true, lastRun: new Date(Date.now() - 1800000).toISOString(), nextRun: new Date(Date.now() + 1800000).toISOString(), lastStatus: 'failed', description: 'Clean application cache files' },
  { id: '5', name: 'Health Check', schedule: '* * * * *', command: '/usr/local/bin/health-check.sh', user: 'monitor', enabled: false, lastRun: new Date(Date.now() - 3600000).toISOString(), nextRun: '—', lastStatus: 'success', description: 'System health check endpoint ping' },
];

export function useMockMetrics() {
  const { setMetrics, setAlerts, setAlertRules, setCronJobs } = useStore();

  useEffect(() => {
    setAlerts(mockAlerts);
    setAlertRules(mockAlertRules);
    setCronJobs(mockCronJobs);

    const tick = () => setMetrics(buildMetrics());
    tick();
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, [setMetrics, setAlerts, setAlertRules, setCronJobs]);
}
