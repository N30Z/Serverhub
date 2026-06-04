package collector

// TimePoint is a single time-series data point (matches frontend TimeSeriesPoint).
type TimePoint struct {
	Time  string  `json:"time"`
	Value float64 `json:"value"`
}

// NetPoint is a network time-series point with RX and TX rates.
type NetPoint struct {
	Time string  `json:"time"`
	RX   float64 `json:"rx"`
	TX   float64 `json:"tx"`
}

// Metrics is the full system snapshot sent to the frontend.
// Field names and types mirror src/types/index.ts in serverhub-ui.
type Metrics struct {
	Hostname     string            `json:"hostname"`
	OS           string            `json:"os"`
	Kernel       string            `json:"kernel"`
	Uptime       uint64            `json:"uptime"`
	CPU          CPUMetrics        `json:"cpu"`
	Memory       MemoryMetrics     `json:"memory"`
	Swap         SwapMetrics       `json:"swap"`
	Disk         []DiskMetrics     `json:"disk"`
	Network      NetworkMetrics    `json:"network"`
	Load         LoadMetrics       `json:"load"`
	Temperatures []TempMetrics     `json:"temperatures"`
	Processes    []Process         `json:"processes"`
	Users        []LoggedUser      `json:"users"`
	Services     []Service         `json:"services"`
	Docker       []DockerContainer `json:"docker"`
}

type CPUMetrics struct {
	Usage     float64     `json:"usage"`
	Cores     int         `json:"cores"`
	Model     string      `json:"model"`
	Frequency float64     `json:"frequency"`
	History   []TimePoint `json:"history"`
	PerCore   []float64   `json:"perCore"`
}

type MemoryMetrics struct {
	Total   float64     `json:"total"`
	Used    float64     `json:"used"`
	Free    float64     `json:"free"`
	Cached  float64     `json:"cached"`
	Buffers float64     `json:"buffers"`
	Usage   float64     `json:"usage"`
	History []TimePoint `json:"history"`
}

type SwapMetrics struct {
	Total float64 `json:"total"`
	Used  float64 `json:"used"`
	Free  float64 `json:"free"`
	Usage float64 `json:"usage"`
}

type DiskMetrics struct {
	Device     string  `json:"device"`
	Mountpoint string  `json:"mountpoint"`
	Fstype     string  `json:"fstype"`
	Total      float64 `json:"total"`
	Used       float64 `json:"used"`
	Free       float64 `json:"free"`
	Usage      float64 `json:"usage"`
	ReadSpeed  float64 `json:"readSpeed"`
	WriteSpeed float64 `json:"writeSpeed"`
}

type NetworkInterface struct {
	Name   string  `json:"name"`
	IP     string  `json:"ip"`
	MAC    string  `json:"mac"`
	RX     float64 `json:"rx"`
	TX     float64 `json:"tx"`
	RXRate float64 `json:"rxRate"`
	TXRate float64 `json:"txRate"`
}

type NetworkMetrics struct {
	Interfaces []NetworkInterface `json:"interfaces"`
	TotalRX    float64            `json:"totalRx"`
	TotalTX    float64            `json:"totalTx"`
	History    []NetPoint         `json:"history"`
}

type LoadMetrics struct {
	Load1   float64     `json:"load1"`
	Load5   float64     `json:"load5"`
	Load15  float64     `json:"load15"`
	History []TimePoint `json:"history"`
}

type TempMetrics struct {
	Sensor      string  `json:"sensor"`
	Temperature float64 `json:"temperature"`
	High        float64 `json:"high"`
	Critical    float64 `json:"critical"`
}

type Process struct {
	PID     int     `json:"pid"`
	Name    string  `json:"name"`
	User    string  `json:"user"`
	CPU     float64 `json:"cpu"`
	Memory  float64 `json:"memory"`
	Status  string  `json:"status"`
	Started string  `json:"started"`
}

type LoggedUser struct {
	User      string `json:"user"`
	TTY       string `json:"tty"`
	From      string `json:"from"`
	LoginTime string `json:"loginTime"`
}

type Service struct {
	Name        string `json:"name"`
	Status      string `json:"status"`
	Enabled     bool   `json:"enabled"`
	Description string `json:"description"`
	Since       string `json:"since"`
}

type DockerContainer struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	Image   string   `json:"image"`
	Status  string   `json:"status"`
	Ports   []string `json:"ports"`
	CPU     float64  `json:"cpu"`
	Memory  float64  `json:"memory"`
	Created string   `json:"created"`
	Uptime  string   `json:"uptime"`
}
