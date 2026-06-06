# ServerHub

A comprehensive server monitoring and management platform with a Go agent, React web UI, and Android app.

![License](https://img.shields.io/badge/license-Apache%202.0-blue)
![Go](https://img.shields.io/badge/go-1.22-00ADD8)
![React](https://img.shields.io/badge/react-19-61DAFB)
![Android](https://img.shields.io/badge/android-SDK%2024%2B-3DDC84)

---

## Overview

ServerHub is a self-hosted platform for real-time Linux server monitoring and remote management. Deploy the lightweight Go agent on any Linux machine and access live metrics, logs, processes, and a web terminal from the browser or the Android app.

**Components:**

| Component | Technology | Purpose |
|-----------|------------|---------|
| `serverhub-agent` | Go 1.22 | Monitoring daemon — REST + WebSocket API, .deb package |
| `serverhub-ui` | React 19, TypeScript, Tailwind CSS | Web dashboard |
| `serverhub-android` | Kotlin, Jetpack Compose | Android companion app |

---

## Features

- **Real-time metrics** — CPU, memory, swap, disk, network, load averages, temperatures
- **Process manager** — live process list with sorting and search
- **Service monitor** — systemd service status at a glance
- **Docker overview** — running and stopped containers
- **Cron manager** — create, edit, and delete cron jobs via the UI
- **Web terminal** — full PTY terminal in the browser (xterm.js)
- **File browser** — browse and preview files over HTTP
- **Alert center** — triggered alert history
- **Customisable dashboard** — drag-and-drop widget layout
- **Mobile app** — Android client with the same feature set

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Clients                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │  Web Browser │   │ Android App  │   │  Any HTTP client │ │
│  │  (React SPA) │   │  (Compose)   │   │                  │ │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘ │
└─────────┼──────────────────┼────────────────────┼───────────┘
          │  HTTP / WebSocket│                     │
┌─────────▼──────────────────▼─────────────────────▼──────────┐
│  serverhub-agent (Go)                                        │
│  ┌──────────┐  ┌────────────────┐  ┌──────────────────────┐ │
│  │ Collector│  │  REST API      │  │  WebSocket broadcast │ │
│  │(gopsutil)│  │ /api/*         │  │  /ws                 │ │
│  └──────────┘  └────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────┐
│  Linux Host                                                  │
│  systemd · /proc · /sys · crontab · Docker socket           │
└──────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Linux host (Debian/Ubuntu recommended for .deb install)
- Go 1.22+ (to build from source)
- Node.js 22+ (to build the UI from source)
- Android Studio (to build the Android app)

### Install the Agent (Debian/Ubuntu)

Download the latest `.deb` release and install it:

```bash
sudo dpkg -i serverhub-agent_*.deb
sudo systemctl enable --now serverhub-agent
```

The agent starts on port `8080` by default and serves the embedded web UI.

### Build from Source

```bash
# 1. Build the web UI (output goes to serverhub-agent/web/)
cd serverhub-ui
npm install
npm run build

# 2. Build the Go agent (embeds the UI build)
cd ../serverhub-agent
make build

# 3. Run
./bin/serverhub-agent
```

### Run the Web UI in Dev Mode

```bash
cd serverhub-ui
npm install
npm run dev
```

The dev server uses mock data — no running agent is required.

---

## Configuration

The agent reads `/etc/serverhub/config.yaml`. An example is provided in `serverhub-agent/packaging/config.yaml.example`:

```yaml
server:
  host: "0.0.0.0"
  port: 8080
  tls:
    enabled: false
    cert_file: ""
    key_file: ""

auth:
  username: "admin"
  password: "admin"

monitoring:
  interval: 3      # seconds between metric collections
  history: 60      # number of data points retained per metric
```

> **Change the default credentials before exposing the agent to a network.**

---

## API Reference

All endpoints require a session cookie obtained from `POST /api/auth/login`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check (unauthenticated) |
| `POST` | `/api/auth/login` | Authenticate and start a session |
| `POST` | `/api/auth/logout` | End the current session |
| `GET` | `/api/metrics` | Snapshot of all current metrics |
| `GET` | `/ws` | WebSocket stream of metrics (JSON) |
| `GET` | `/api/terminal` | Web terminal HTML page |
| `GET` (WS) | `/api/terminal` | PTY WebSocket (xterm.js protocol) |
| `GET` | `/api/files?path=` | List directory contents |
| `GET` | `/api/files/read?path=` | Read a file (max 1 MB) |
| `POST` | `/api/exec` | Execute a one-shot command (30 s timeout) |
| `GET` | `/api/cron` | List cron jobs |
| `POST` | `/api/cron` | Create a cron job |
| `PUT` | `/api/cron/:id` | Update a cron job |
| `DELETE` | `/api/cron/:id` | Delete a cron job |

---

## Project Structure

```
Serverhub/
├── serverhub-agent/          # Go monitoring daemon
│   ├── main.go
│   ├── internal/
│   │   ├── api/              # HTTP server, WebSocket, terminal, exec, files, cron
│   │   ├── collector/        # System metrics collection (gopsutil)
│   │   └── config/           # YAML config loader
│   ├── packaging/
│   │   ├── debian/           # .deb control files
│   │   ├── systemd/          # systemd unit file
│   │   └── config.yaml.example
│   └── Makefile
│
├── serverhub-ui/             # React web dashboard
│   ├── src/
│   │   ├── components/       # Dashboard widgets and feature components
│   │   ├── hooks/            # useMockMetrics (dev + prod WebSocket)
│   │   ├── pages/            # Login, Dashboard views
│   │   ├── store/            # Zustand global state
│   │   └── types/            # Shared TypeScript interfaces
│   └── package.json
│
├── serverhub-android/        # Kotlin/Compose Android app
│   └── app/src/main/java/com/serverhub/android/
│       ├── data/
│       │   ├── api/          # OkHttp REST + WebSocket client
│       │   └── model/        # Serialisable data models
│       ├── ui/screens/       # Compose screens
│       └── viewmodel/        # MainViewModel
│
└── .github/workflows/        # CI/CD — agent .deb build, Android APK build
```

---

## Contributing

1. Fork the repository and create a feature branch.
2. Make your changes with clear commit messages.
3. Ensure the Go agent builds (`make build`) and the UI builds (`npm run build`) without errors.
4. Open a pull request.

---

## License

Apache 2.0 — see [LICENSE](LICENSE).
