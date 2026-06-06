package collector

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"

	gocpu "github.com/shirou/gopsutil/v3/cpu"
	godisk "github.com/shirou/gopsutil/v3/disk"
	gohost "github.com/shirou/gopsutil/v3/host"
	goload "github.com/shirou/gopsutil/v3/load"
	gomem "github.com/shirou/gopsutil/v3/mem"
	gonet "github.com/shirou/gopsutil/v3/net"

	"github.com/n30z/serverhub-agent/internal/config"
)

// Collector gathers system metrics on a fixed interval and broadcasts them.
type Collector struct {
	cfg     *config.Config
	Updates chan []byte // receives freshly marshalled Metrics JSON on each tick

	mu            sync.RWMutex
	payload       []byte   // last marshalled JSON
	latestMetrics *Metrics

	cpuHist  []TimePoint
	memHist  []TimePoint
	loadHist []TimePoint
	netHist  []NetPoint

	prevNetIO    map[string]gonet.IOCountersStat
	prevDiskIO   map[string]godisk.IOCountersStat
	prevCollectT time.Time
}

func New(cfg *config.Config) *Collector {
	return &Collector{
		cfg:        cfg,
		Updates:    make(chan []byte, 1),
		prevNetIO:  make(map[string]gonet.IOCountersStat),
		prevDiskIO: make(map[string]godisk.IOCountersStat),
	}
}

// Init seeds baselines and performs the first collection synchronously.
func (c *Collector) Init() {
	// Prime the CPU percent sampler (first call always returns 0)
	gocpu.Percent(0, false) //nolint:errcheck
	gocpu.Percent(0, true)  //nolint:errcheck

	if counters, err := gonet.IOCounters(true); err == nil {
		for _, s := range counters {
			c.prevNetIO[s.Name] = s
		}
	}
	if iomap, err := godisk.IOCounters(); err == nil {
		for name, s := range iomap {
			c.prevDiskIO[name] = s
		}
	}
	c.prevCollectT = time.Now()
	c.collect()
}

// Run starts the periodic collection loop. Call Init() first.
func (c *Collector) Run(ctx context.Context) {
	interval := time.Duration(c.cfg.Monitoring.Interval) * time.Second
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			c.collect()
		case <-ctx.Done():
			return
		}
	}
}

// LatestMetrics returns a pointer to the most recently collected Metrics struct.
func (c *Collector) LatestMetrics() *Metrics {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.latestMetrics
}

// LatestJSON returns a copy of the most recently marshalled metrics.
func (c *Collector) LatestJSON() []byte {
	c.mu.RLock()
	defer c.mu.RUnlock()
	cp := make([]byte, len(c.payload))
	copy(cp, c.payload)
	return cp
}

func (c *Collector) collect() {
	now := time.Now()
	elapsed := now.Sub(c.prevCollectT).Seconds()
	if elapsed <= 0 {
		elapsed = float64(c.cfg.Monitoring.Interval)
	}

	m := &Metrics{}

	// ── Host ──────────────────────────────────────────────────────────────────
	if info, err := gohost.Info(); err == nil {
		m.Hostname = info.Hostname
		m.OS = fmt.Sprintf("%s %s", info.Platform, info.PlatformVersion)
		m.Kernel = info.KernelVersion
		m.Uptime = info.Uptime
	}

	// ── CPU ───────────────────────────────────────────────────────────────────
	cpuPcts, _ := gocpu.Percent(0, false)
	cpuPerCore, _ := gocpu.Percent(0, true)
	cpuInfo, _ := gocpu.Info()
	coreCount, _ := gocpu.Counts(true)

	usage := 0.0
	if len(cpuPcts) > 0 {
		usage = cpuPcts[0]
	}
	model, freq := "", 0.0
	if len(cpuInfo) > 0 {
		model = cpuInfo[0].ModelName
		freq = r2(cpuInfo[0].Mhz / 1000.0)
	}
	m.CPU = CPUMetrics{
		Usage:     r2(usage),
		Cores:     coreCount,
		Model:     model,
		Frequency: freq,
		PerCore:   r2slice(cpuPerCore),
	}

	// ── Memory ────────────────────────────────────────────────────────────────
	if vm, err := gomem.VirtualMemory(); err == nil {
		m.Memory = MemoryMetrics{
			Total:   toMB(vm.Total),
			Used:    toMB(vm.Used),
			Free:    toMB(vm.Free),
			Cached:  toMB(vm.Cached),
			Buffers: toMB(vm.Buffers),
			Usage:   r2(vm.UsedPercent),
		}
	}

	// ── Swap ──────────────────────────────────────────────────────────────────
	if sw, err := gomem.SwapMemory(); err == nil {
		m.Swap = SwapMetrics{
			Total: toMB(sw.Total),
			Used:  toMB(sw.Used),
			Free:  toMB(sw.Free),
			Usage: r2(sw.UsedPercent),
		}
	}

	// ── Load ──────────────────────────────────────────────────────────────────
	if la, err := goload.Avg(); err == nil {
		m.Load = LoadMetrics{
			Load1:  r2(la.Load1),
			Load5:  r2(la.Load5),
			Load15: r2(la.Load15),
		}
	}

	// ── Disk ──────────────────────────────────────────────────────────────────
	currDiskIO, _ := godisk.IOCounters()
	if parts, err := godisk.Partitions(false); err == nil {
		for _, p := range parts {
			if !isPhysicalFS(p.Fstype) {
				continue
			}
			u, err := godisk.Usage(p.Mountpoint)
			if err != nil {
				continue
			}
			dm := DiskMetrics{
				Device:     p.Device,
				Mountpoint: p.Mountpoint,
				Fstype:     p.Fstype,
				Total:      toMB(u.Total),
				Used:       toMB(u.Used),
				Free:       toMB(u.Free),
				Usage:      r2(u.UsedPercent),
			}
			devName := diskDevName(p.Device)
			if curr, ok := currDiskIO[devName]; ok {
				if prev, ok2 := c.prevDiskIO[devName]; ok2 {
					dm.ReadSpeed = r2(float64(curr.ReadBytes-prev.ReadBytes) / elapsed / 1048576)
					dm.WriteSpeed = r2(float64(curr.WriteBytes-prev.WriteBytes) / elapsed / 1048576)
				}
			}
			m.Disk = append(m.Disk, dm)
		}
	}
	for name, s := range currDiskIO {
		c.prevDiskIO[name] = s
	}

	// ── Network ───────────────────────────────────────────────────────────────
	currNetIO, _ := gonet.IOCounters(true)
	ifaces, _ := net.Interfaces()
	ifaceByName := make(map[string]net.Interface, len(ifaces))
	for _, iface := range ifaces {
		ifaceByName[iface.Name] = iface
	}

	var totalRX, totalTX, overallRXRate, overallTXRate float64
	for _, ctr := range currNetIO {
		if skipNetIface(ctr.Name) {
			continue
		}
		ni := NetworkInterface{
			Name: ctr.Name,
			RX:   float64(ctr.BytesRecv),
			TX:   float64(ctr.BytesSent),
		}
		if iface, ok := ifaceByName[ctr.Name]; ok {
			addrs, _ := iface.Addrs()
			for _, addr := range addrs {
				if ip, _, err := net.ParseCIDR(addr.String()); err == nil {
					if ip4 := ip.To4(); ip4 != nil {
						ni.IP = ip4.String()
						break
					}
				}
			}
			ni.MAC = iface.HardwareAddr.String()
		}
		if prev, ok := c.prevNetIO[ctr.Name]; ok {
			ni.RXRate = math.Max(0, r2(float64(ctr.BytesRecv-prev.BytesRecv)/elapsed/1048576))
			ni.TXRate = math.Max(0, r2(float64(ctr.BytesSent-prev.BytesSent)/elapsed/1048576))
		}
		totalRX += float64(ctr.BytesRecv)
		totalTX += float64(ctr.BytesSent)
		overallRXRate += ni.RXRate
		overallTXRate += ni.TXRate
		m.Network.Interfaces = append(m.Network.Interfaces, ni)
	}
	for _, ctr := range currNetIO {
		c.prevNetIO[ctr.Name] = ctr
	}
	m.Network.TotalRX = totalRX
	m.Network.TotalTX = totalTX

	// ── Temperatures ──────────────────────────────────────────────────────────
	if temps, err := gohost.SensorsTemperatures(); err == nil {
		for _, t := range temps {
			if t.Temperature <= 0 {
				continue
			}
			high, crit := t.High, t.Critical
			if high <= 0 {
				high = 80
			}
			if crit <= 0 {
				crit = 95
			}
			m.Temperatures = append(m.Temperatures, TempMetrics{
				Sensor:      t.SensorKey,
				Temperature: r2(t.Temperature),
				High:        high,
				Critical:    crit,
			})
		}
	}

	// ── Exec-based collectors (best-effort) ───────────────────────────────────
	m.Processes = collectProcesses()
	m.Services = collectServices()
	m.Users = collectUsers()
	m.Docker = collectDocker()

	// ── History ───────────────────────────────────────────────────────────────
	nowStr := now.UTC().Format(time.RFC3339)
	max := c.cfg.Monitoring.History
	c.cpuHist = appendCapped(c.cpuHist, TimePoint{Time: nowStr, Value: m.CPU.Usage}, max)
	c.memHist = appendCapped(c.memHist, TimePoint{Time: nowStr, Value: m.Memory.Usage}, max)
	c.loadHist = appendCapped(c.loadHist, TimePoint{Time: nowStr, Value: m.Load.Load1}, max)
	c.netHist = appendCapped(c.netHist, NetPoint{Time: nowStr, RX: overallRXRate, TX: overallTXRate}, max)

	m.CPU.History = c.cpuHist
	m.Memory.History = c.memHist
	m.Load.History = c.loadHist
	m.Network.History = c.netHist

	c.prevCollectT = now

	// ── Serialise and publish ─────────────────────────────────────────────────
	data, err := json.Marshal(m)
	if err != nil {
		return
	}
	c.mu.Lock()
	c.payload = data
	c.latestMetrics = m
	c.mu.Unlock()

	select {
	case c.Updates <- data:
	default:
	}
}

// ── exec-based collectors ─────────────────────────────────────────────────────

func collectProcesses() []Process {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	out, err := exec.CommandContext(ctx,
		"ps", "-eo", "pid=,user=,pcpu=,pmem=,stat=,comm=,etime=", "--sort=-pcpu",
	).Output()
	if err != nil {
		return nil
	}
	var procs []Process
	scanner := bufio.NewScanner(bytes.NewReader(out))
	for scanner.Scan() && len(procs) < 20 {
		fields := strings.Fields(strings.TrimSpace(scanner.Text()))
		if len(fields) < 6 {
			continue
		}
		pid, _ := strconv.Atoi(fields[0])
		cpu, _ := strconv.ParseFloat(fields[2], 64)
		mem, _ := strconv.ParseFloat(fields[3], 64)
		stat := fields[4]
		if len(stat) > 1 {
			stat = stat[:1]
		}
		etime := ""
		if len(fields) >= 7 {
			etime = fields[6]
		}
		procs = append(procs, Process{
			PID:     pid,
			User:    fields[1],
			CPU:     r2(cpu),
			Memory:  r2(mem),
			Status:  stat,
			Name:    fields[5],
			Started: etimeToAgo(etime),
		})
	}
	return procs
}

func collectServices() []Service {
	if _, err := exec.LookPath("systemctl"); err != nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	// Enabled units
	enabledSet := make(map[string]bool)
	if out, err := exec.CommandContext(ctx, "systemctl", "list-unit-files",
		"--type=service", "--state=enabled", "--no-pager", "--no-legend", "--plain",
	).Output(); err == nil {
		sc := bufio.NewScanner(bytes.NewReader(out))
		for sc.Scan() {
			fields := strings.Fields(sc.Text())
			if len(fields) >= 1 {
				enabledSet[strings.TrimSuffix(fields[0], ".service")] = true
			}
		}
	}

	// Active/inactive units
	out, err := exec.CommandContext(ctx, "systemctl", "list-units",
		"--type=service", "--all", "--no-pager", "--no-legend", "--plain",
	).Output()
	if err != nil {
		return nil
	}

	var services []Service
	sc := bufio.NewScanner(bytes.NewReader(out))
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 4 || !strings.HasSuffix(fields[0], ".service") {
			continue
		}
		name := strings.TrimSuffix(fields[0], ".service")
		active, sub := fields[2], fields[3]
		desc := ""
		if len(fields) > 4 {
			desc = strings.Join(fields[4:], " ")
		}
		status := "inactive"
		switch {
		case active == "active" && sub == "running":
			status = "active"
		case active == "failed":
			status = "failed"
		}
		services = append(services, Service{
			Name:        name,
			Status:      status,
			Enabled:     enabledSet[name],
			Description: desc,
		})
	}
	return services
}

func collectUsers() []LoggedUser {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	out, err := exec.CommandContext(ctx, "who").Output()
	if err != nil {
		return nil
	}
	var users []LoggedUser
	sc := bufio.NewScanner(bytes.NewReader(out))
	for sc.Scan() {
		// who output: user tty date time (from)
		fields := strings.Fields(sc.Text())
		if len(fields) < 4 {
			continue
		}
		from := ""
		if len(fields) >= 5 {
			from = strings.Trim(fields[4], "()")
		}
		users = append(users, LoggedUser{
			User:      fields[0],
			TTY:       fields[1],
			From:      from,
			LoginTime: fields[2] + " " + fields[3],
		})
	}
	return users
}

func collectDocker() []DockerContainer {
	if _, err := exec.LookPath("docker"); err != nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 12*time.Second)
	defer cancel()

	// Get container list
	out, err := exec.CommandContext(ctx, "docker", "ps", "-a",
		"--format", `{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}|{{.CreatedAt}}`,
	).Output()
	if err != nil {
		return nil
	}

	// Get stats (non-blocking, short timeout)
	sctx, scancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer scancel()
	statsOut, _ := exec.CommandContext(sctx, "docker", "stats", "--no-stream",
		"--format", `{{.ID}}|{{.CPUPerc}}|{{.MemPerc}}`,
	).Output()

	statsMap := make(map[string][2]float64)
	if statsOut != nil {
		sc := bufio.NewScanner(bytes.NewReader(statsOut))
		for sc.Scan() {
			f := strings.SplitN(sc.Text(), "|", 3)
			if len(f) == 3 {
				cpu, _ := strconv.ParseFloat(strings.TrimSuffix(f[1], "%"), 64)
				mem, _ := strconv.ParseFloat(strings.TrimSuffix(f[2], "%"), 64)
				statsMap[f[0]] = [2]float64{cpu, mem}
			}
		}
	}

	var containers []DockerContainer
	sc := bufio.NewScanner(bytes.NewReader(out))
	for sc.Scan() {
		fields := strings.SplitN(sc.Text(), "|", 6)
		if len(fields) < 5 {
			continue
		}
		id, name, image, statusFull, portsRaw := fields[0], fields[1], fields[2], fields[3], fields[4]
		created := ""
		if len(fields) == 6 {
			created = fields[5]
		}

		status, uptime := parseDockerStatus(statusFull)
		var ports []string
		for _, p := range strings.Split(portsRaw, ",") {
			if p = strings.TrimSpace(p); p != "" {
				ports = append(ports, p)
			}
		}

		cpu, mem := 0.0, 0.0
		if s, ok := statsMap[id]; ok {
			cpu = r2(s[0])
			mem = r2(s[1])
		}
		containers = append(containers, DockerContainer{
			ID:      id,
			Name:    strings.TrimPrefix(name, "/"),
			Image:   image,
			Status:  status,
			Ports:   ports,
			CPU:     cpu,
			Memory:  mem,
			Created: created,
			Uptime:  uptime,
		})
	}
	return containers
}

// ── helpers ───────────────────────────────────────────────────────────────────

func r2(f float64) float64 {
	return math.Round(f*100) / 100
}

func r2slice(s []float64) []float64 {
	out := make([]float64, len(s))
	for i, v := range s {
		out[i] = r2(v)
	}
	return out
}

func toMB(b uint64) float64 {
	return r2(float64(b) / 1048576)
}

func appendCapped[T any](s []T, v T, max int) []T {
	s = append(s, v)
	if max > 0 && len(s) > max {
		s = s[len(s)-max:]
	}
	return s
}

var virtualFS = map[string]bool{
	"proc": true, "sysfs": true, "devtmpfs": true, "devpts": true,
	"tmpfs": true, "cgroup": true, "cgroup2": true, "overlay": true,
	"debugfs": true, "securityfs": true, "fusectl": true, "fuse.lxcfs": true,
	"hugetlbfs": true, "mqueue": true, "pstore": true, "autofs": true,
	"bpf": true, "tracefs": true, "configfs": true, "ramfs": true,
	"squashfs": true, "nsfs": true, "efivarfs": true,
}

func isPhysicalFS(fstype string) bool {
	return !virtualFS[fstype]
}

func diskDevName(device string) string {
	// /dev/nvme0n1p1 → nvme0n1  |  /dev/sda1 → sda
	name := strings.TrimPrefix(device, "/dev/")
	// NVMe: strip trailing 'p<digits>'
	if idx := strings.LastIndex(name, "p"); idx > 0 {
		if _, err := strconv.Atoi(name[idx+1:]); err == nil {
			return name[:idx]
		}
	}
	// SATA/SAS: strip trailing digits
	i := len(name) - 1
	for i >= 0 && name[i] >= '0' && name[i] <= '9' {
		i--
	}
	return name[:i+1]
}

func skipNetIface(name string) bool {
	return name == "lo" ||
		strings.HasPrefix(name, "docker") ||
		strings.HasPrefix(name, "veth") ||
		strings.HasPrefix(name, "br-") ||
		strings.HasPrefix(name, "virbr")
}

func parseDockerStatus(s string) (status, uptime string) {
	switch {
	case strings.HasPrefix(s, "Up"):
		return "running", strings.TrimPrefix(s, "Up ")
	case strings.HasPrefix(s, "Exited"):
		return "exited", ""
	case strings.HasPrefix(s, "Paused"):
		return "paused", ""
	case strings.HasPrefix(s, "Restarting"):
		return "restarting", ""
	default:
		return "stopped", ""
	}
}

// etimeToAgo converts ps etime format ([[DD-]HH:]MM:SS) to "Xd/h/m ago".
func etimeToAgo(etime string) string {
	if etime == "" {
		return "N/A"
	}
	days, rest := 0, etime
	if idx := strings.Index(etime, "-"); idx >= 0 {
		days, _ = strconv.Atoi(etime[:idx])
		rest = etime[idx+1:]
	}
	parts := strings.Split(rest, ":")
	hours, mins := 0, 0
	switch len(parts) {
	case 3:
		hours, _ = strconv.Atoi(parts[0])
		mins, _ = strconv.Atoi(parts[1])
	case 2:
		mins, _ = strconv.Atoi(parts[0])
	}
	switch {
	case days > 0:
		return fmt.Sprintf("%dd ago", days)
	case hours > 0:
		return fmt.Sprintf("%dh ago", hours)
	case mins > 0:
		return fmt.Sprintf("%dm ago", mins)
	default:
		return "just now"
	}
}
