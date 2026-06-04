import type {
  SystemMetrics, Alert, AlertRule, CronJob, SFTPEntry
} from '../types';

/* ─────────────────────────────────────────────────────────
   Deterministic pseudo-random series — same result every render
   ───────────────────────────────────────────────────────── */
function series(base: number, variance: number, n = 24, seed = 1) {
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => ({
    time: new Date(now - (n - i) * 5000).toISOString(),
    value: Math.max(2, Math.min(100,
      base + Math.sin(i / 2.2) * variance * 0.5 + (rand() - 0.5) * variance
    )),
  }));
}

function netSeries(n = 24, seed = 7) {
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => ({
    time: new Date(now - (n - i) * 5000).toISOString(),
    rx: Math.max(4, 60 + Math.sin(i / 3) * 30 + (rand() - 0.5) * 40),
    tx: Math.max(2, 22 + Math.cos(i / 2.5) * 12 + (rand() - 0.5) * 18),
  }));
}

/* ─────────────────────────────────────────────────────────
   System metrics
   ───────────────────────────────────────────────────────── */
export const MOCK_METRICS: SystemMetrics = {
  hostname: 'prod-server-01',
  os: 'Ubuntu 24.04.1 LTS',
  kernel: '6.8.0-51-generic',
  uptime: 1209600 + 8100,

  cpu: {
    usage: 47.4,
    cores: 16,
    model: 'AMD Ryzen 9 5950X 16-Core',
    frequency: 3.9,
    history: series(46, 28, 24, 11),
    perCore: [38, 71, 22, 54, 19, 83, 44, 12, 61, 29, 48, 9, 35, 77, 26, 52],
  },
  memory: {
    total: 32768, used: 19420, free: 8192, cached: 4096, buffers: 1060,
    usage: 64.2, history: series(63, 14, 24, 23),
  },
  swap: { total: 8192, used: 612, free: 7580, usage: 7 },
  load: { load1: 1.82, load5: 2.14, load15: 1.95, history: series(34, 22, 24, 31) },
  disk: [
    { device: '/dev/nvme0n1p2', mountpoint: '/', fstype: 'ext4', total: 512000, used: 225280, free: 286720, usage: 44, readSpeed: 482, writeSpeed: 241 },
    { device: '/dev/sda1', mountpoint: '/data', fstype: 'xfs', total: 2097152, used: 819200, free: 1277952, usage: 39, readSpeed: 168, writeSpeed: 92 },
    { device: '/dev/sdb1', mountpoint: '/backup', fstype: 'ext4', total: 4194304, used: 3355443, free: 838861, usage: 80, readSpeed: 121, writeSpeed: 63 },
  ],
  network: {
    interfaces: [
      { name: 'eth0', ip: '192.168.1.100', mac: '00:1A:2B:3C:4D:5E', rx: 1.2e9, tx: 320e6, rxRate: 92.4, txRate: 24.8 },
      { name: 'eth1', ip: '10.0.0.1', mac: '00:1A:2B:3C:4D:5F', rx: 500e6, tx: 150e6, rxRate: 14.1, txRate: 6.2 },
    ],
    totalRx: 1.7e9, totalTx: 470e6,
    history: netSeries(),
  },
  temperatures: [
    { sensor: 'CPU Package', temperature: 58.2, high: 80, critical: 95 },
    { sensor: 'CPU Core 0', temperature: 52.4, high: 80, critical: 95 },
    { sensor: 'NVMe Composite', temperature: 41.0, high: 75, critical: 85 },
    { sensor: 'MB Temp', temperature: 34.6, high: 60, critical: 75 },
  ],
  processes: [
    { pid: 4120, name: 'python3', user: 'worker', cpu: 22.1, memory: 3.2, status: 'R', started: '1h ago' },
    { pid: 3891, name: 'node', user: 'app', cpu: 12.8, memory: 8.7, status: 'S', started: '4h ago' },
    { pid: 1245, name: 'postgres', user: 'postgres', cpu: 8.2, memory: 4.1, status: 'S', started: '2d ago' },
    { pid: 6541, name: 'docker', user: 'root', cpu: 3.2, memory: 2.1, status: 'S', started: '2d ago' },
    { pid: 7823, name: 'prometheus', user: 'prometheus', cpu: 1.9, memory: 5.4, status: 'S', started: '2d ago' },
    { pid: 2380, name: 'nginx', user: 'www-data', cpu: 1.4, memory: 0.3, status: 'S', started: '2d ago' },
    { pid: 5002, name: 'redis-server', user: 'redis', cpu: 0.8, memory: 1.2, status: 'S', started: '2d ago' },
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

/* ─────────────────────────────────────────────────────────
   Alerts
   ───────────────────────────────────────────────────────── */
export const MOCK_ALERTS: Alert[] = [
  { id: '3', type: 'docker', severity: 'critical', title: 'Container Stopped', message: 'Container worker-queue has stopped unexpectedly', timestamp: new Date(Date.now() - 1800000).toISOString(), resolved: false, server: 'prod-server-01' },
  { id: '1', type: 'disk', severity: 'warning', title: 'Low Disk Space', message: '/backup is 80% full (3.2 TB / 4.0 TB used)', timestamp: new Date(Date.now() - 3600000).toISOString(), resolved: false, server: 'prod-server-01' },
  { id: '2', type: 'cpu', severity: 'warning', title: 'High CPU Usage', message: 'CPU usage exceeded 85% threshold for 5 minutes', timestamp: new Date(Date.now() - 7200000).toISOString(), resolved: true, server: 'prod-server-01' },
  { id: '4', type: 'service', severity: 'info', title: 'Service Restarted', message: 'nginx was restarted successfully', timestamp: new Date(Date.now() - 86400000).toISOString(), resolved: true, server: 'prod-server-01' },
];

/* ─────────────────────────────────────────────────────────
   Alert rules
   ───────────────────────────────────────────────────────── */
export const MOCK_ALERT_RULES: AlertRule[] = [
  { id: '1', type: 'cpu', enabled: true, threshold: 85, duration: 5, notifyEmail: true, notifyPush: true, description: 'Alert when CPU usage exceeds threshold' },
  { id: '2', type: 'memory', enabled: true, threshold: 90, duration: 2, notifyEmail: true, notifyPush: true, description: 'Alert when memory usage is critical' },
  { id: '3', type: 'disk', enabled: true, threshold: 80, duration: 0, notifyEmail: true, notifyPush: false, description: 'Alert when any disk exceeds usage threshold' },
  { id: '4', type: 'service', enabled: true, threshold: 0, duration: 0, notifyEmail: true, notifyPush: true, description: 'Alert when a monitored service stops' },
  { id: '5', type: 'docker', enabled: false, threshold: 0, duration: 0, notifyEmail: false, notifyPush: true, description: 'Alert when a container exits unexpectedly' },
];

/* ─────────────────────────────────────────────────────────
   Cron jobs
   ───────────────────────────────────────────────────────── */
export const MOCK_CRON_JOBS: CronJob[] = [
  { id: '1', name: 'Database Backup', schedule: '0 2 * * *', command: '/usr/local/bin/backup-db.sh', user: 'root', enabled: true, lastRun: new Date(Date.now() - 72000000).toISOString(), nextRun: new Date(Date.now() + 14400000).toISOString(), lastStatus: 'success', description: 'Full database backup to /backup' },
  { id: '2', name: 'Log Rotation', schedule: '0 0 * * 0', command: '/usr/sbin/logrotate /etc/logrotate.conf', user: 'root', enabled: true, lastRun: new Date(Date.now() - 604800000).toISOString(), nextRun: new Date(Date.now() + 172800000).toISOString(), lastStatus: 'success', description: 'Weekly log rotation' },
  { id: '3', name: 'SSL Cert Renewal', schedule: '0 12 * * *', command: 'certbot renew --quiet', user: 'root', enabled: true, lastRun: new Date(Date.now() - 86400000).toISOString(), nextRun: new Date(Date.now() + 86400000).toISOString(), lastStatus: 'success', description: 'Automatic SSL certificate renewal' },
  { id: '4', name: 'Cache Cleanup', schedule: '*/30 * * * *', command: '/usr/local/bin/clear-cache.sh', user: 'app', enabled: true, lastRun: new Date(Date.now() - 1800000).toISOString(), nextRun: new Date(Date.now() + 1800000).toISOString(), lastStatus: 'failed', description: 'Clean application cache files' },
  { id: '5', name: 'Health Check', schedule: '* * * * *', command: '/usr/local/bin/health-check.sh', user: 'monitor', enabled: false, lastRun: new Date(Date.now() - 3600000).toISOString(), nextRun: '—', lastStatus: 'success', description: 'System health check endpoint ping' },
];

/* ─────────────────────────────────────────────────────────
   SFTP entries
   ───────────────────────────────────────────────────────── */
export const MOCK_SFTP_ENTRIES: SFTPEntry[] = [
  { name: '.ssh', path: '/home/admin/.ssh', type: 'directory', size: 0, permissions: 'drwx------', owner: 'admin', group: 'admin', modified: '2025-05-15 12:00', isHidden: true },
  { name: 'projects', path: '/home/admin/projects', type: 'directory', size: 0, permissions: 'drwxr-xr-x', owner: 'admin', group: 'admin', modified: '2025-06-02 18:30', isHidden: false },
  { name: 'backups', path: '/home/admin/backups', type: 'directory', size: 0, permissions: 'drwxr-xr-x', owner: 'admin', group: 'admin', modified: '2025-06-03 02:00', isHidden: false },
  { name: 'config.yaml', path: '/home/admin/config.yaml', type: 'file', size: 2048, permissions: '-rw-r--r--', owner: 'admin', group: 'admin', modified: '2025-06-01 09:45', isHidden: false },
  { name: 'deploy.sh', path: '/home/admin/deploy.sh', type: 'file', size: 4096, permissions: '-rwxr-xr-x', owner: 'admin', group: 'admin', modified: '2025-06-02 15:20', isHidden: false },
  { name: 'README.md', path: '/home/admin/README.md', type: 'file', size: 1024, permissions: '-rw-r--r--', owner: 'admin', group: 'admin', modified: '2025-05-30 11:00', isHidden: false },
  { name: 'database-backup-20250603.sql.gz', path: '/home/admin/backups/database-backup-20250603.sql.gz', type: 'file', size: 524288000, permissions: '-rw-r--r--', owner: 'admin', group: 'admin', modified: '2025-06-03 02:00', isHidden: false },
  { name: 'logs.tar.gz', path: '/home/admin/logs.tar.gz', type: 'file', size: 10485760, permissions: '-rw-r--r--', owner: 'admin', group: 'admin', modified: '2025-06-02 23:00', isHidden: false },
];

/* ─────────────────────────────────────────────────────────
   SSH terminal transcript
   ───────────────────────────────────────────────────────── */
export interface SshLine {
  type: 'system' | 'prompt' | 'output' | 'error' | 'active';
  text: string;
  prompt?: string;
}

export const MOCK_SSH_LINES: SshLine[] = [
  { type: 'system', text: '⚡ Connected to prod-server-01 (192.168.1.100:22) as admin' },
  { type: 'system', text: 'ServerHub SSH Client v1.0 — Type commands below' },
  { type: 'output', text: '' },
  { type: 'output', text: 'Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-51-generic x86_64)' },
  { type: 'output', text: '' },
  { type: 'output', text: '  System information as of Tue Jun  3 14:30:01 UTC 2025' },
  { type: 'output', text: '' },
  { type: 'output', text: '  System load:  1.82               Users logged in:        3' },
  { type: 'output', text: '  Usage of /:   44.2% of 490.0GB    Memory usage:           64%' },
  { type: 'output', text: '  Swap usage:   7%                  Processes:             287' },
  { type: 'output', text: '' },
  { type: 'prompt', prompt: 'admin@100:~$', text: 'df -h' },
  { type: 'output', text: 'Filesystem      Size  Used Avail Use% Mounted on' },
  { type: 'output', text: '/dev/nvme0n1p2  490G  220G  250G  47% /' },
  { type: 'output', text: '/dev/sda1       2.0T  800G  1.2T  40% /data' },
  { type: 'output', text: '/dev/sdb1       3.9T  3.2T  700G  82% /backup' },
  { type: 'output', text: 'tmpfs           7.8G  8.0M  7.8G   1% /tmp' },
  { type: 'prompt', prompt: 'admin@100:~$', text: 'systemctl status nginx' },
  { type: 'output', text: '● nginx.service - A high performance web server and a reverse proxy server' },
  { type: 'output', text: '     Loaded: loaded (/lib/systemd/system/nginx.service; enabled)' },
  { type: 'active', text: '     Active: active (running) since Mon 2025-06-01 10:00:00 UTC; 2 days ago' },
  { type: 'output', text: '   Main PID: 2381 (nginx)' },
  { type: 'output', text: '      Tasks: 9 (limit: 38467)     Memory: 12.4M' },
];
