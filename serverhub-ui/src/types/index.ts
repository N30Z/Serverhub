export interface SystemMetrics {
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  swap: SwapMetrics;
  disk: DiskMetrics[];
  network: NetworkMetrics;
  load: LoadMetrics;
  uptime: number;
  hostname: string;
  os: string;
  kernel: string;
  temperatures: TempMetrics[];
  processes: Process[];
  users: LoggedUser[];
  services: Service[];
  docker: DockerContainer[];
}

export interface CpuMetrics {
  usage: number;
  cores: number;
  model: string;
  frequency: number;
  history: TimeSeriesPoint[];
  perCore: number[];
}

export interface MemoryMetrics {
  total: number;
  used: number;
  free: number;
  cached: number;
  buffers: number;
  usage: number;
  history: TimeSeriesPoint[];
}

export interface SwapMetrics {
  total: number;
  used: number;
  free: number;
  usage: number;
}

export interface DiskMetrics {
  device: string;
  mountpoint: string;
  fstype: string;
  total: number;
  used: number;
  free: number;
  usage: number;
  readSpeed: number;
  writeSpeed: number;
}

export interface NetworkMetrics {
  interfaces: NetworkInterface[];
  totalRx: number;
  totalTx: number;
  history: NetworkHistoryPoint[];
}

export interface NetworkInterface {
  name: string;
  rx: number;
  tx: number;
  rxRate: number;
  txRate: number;
  ip: string;
  mac: string;
}

export interface NetworkHistoryPoint {
  time: string;
  rx: number;
  tx: number;
}

export interface LoadMetrics {
  load1: number;
  load5: number;
  load15: number;
  history: TimeSeriesPoint[];
}

export interface TempMetrics {
  sensor: string;
  temperature: number;
  high: number;
  critical: number;
}

export interface Process {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  memory: number;
  status: string;
  started: string;
}

export interface LoggedUser {
  user: string;
  tty: string;
  from: string;
  loginTime: string;
}

export interface Service {
  name: string;
  status: 'active' | 'inactive' | 'failed' | 'unknown';
  enabled: boolean;
  description: string;
  since: string;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused' | 'restarting' | 'exited';
  ports: string[];
  cpu: number;
  memory: number;
  created: string;
  uptime: string;
}

export interface TimeSeriesPoint {
  time: string;
  value: number;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  server: string;
}

export type AlertType = 'cpu' | 'memory' | 'disk' | 'service' | 'docker' | 'host';

export interface AlertRule {
  id: string;
  type: AlertType;
  enabled: boolean;
  threshold: number;
  duration: number;
  notifyEmail: boolean;
  notifyPush: boolean;
  description: string;
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  command: string;
  user: string;
  enabled: boolean;
  lastRun: string | null;
  nextRun: string;
  lastStatus: 'success' | 'failed' | 'running' | null;
  description: string;
}

export interface CronExecution {
  id: string;
  jobId: string;
  startTime: string;
  endTime: string;
  status: 'success' | 'failed';
  output: string;
  exitCode: number;
  duration: number;
}

export interface SFTPEntry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  permissions: string;
  owner: string;
  group: string;
  modified: string;
  isHidden: boolean;
}

export interface SSHSession {
  id: string;
  title: string;
  host: string;
  user: string;
  connected: boolean;
  createdAt: string;
}

export interface ServerConfig {
  server: {
    host: string;
    port: number;
    tls: boolean;
  };
  monitoring: {
    interval: number;
  };
  notifications: {
    email_enabled: boolean;
    push_enabled: boolean;
    email_smtp_host: string;
    email_smtp_port: number;
    email_from: string;
    email_to: string[];
  };
  auth: {
    session_timeout: number;
    max_sessions: number;
    two_factor: boolean;
  };
  future: {
    central_management: boolean;
  };
}

export type Theme = 'dark' | 'light';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
}

export type WidgetType =
  | 'cpu'
  | 'memory'
  | 'swap'
  | 'load'
  | 'temperature'
  | 'network'
  | 'disk'
  | 'filesystems'
  | 'processes'
  | 'docker'
  | 'services'
  | 'uptime'
  | 'users'
  | 'bandwidth'
  | 'logs'
  | 'firewall'
  | 'custom';
