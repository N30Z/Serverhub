# TODO

Items identified in the codebase that are unimplemented, stubbed, or explicitly deferred.

---

## High Priority

### Alert Rules Backend
- **Status:** UI types and layout exist; backend has no alert rules storage or evaluation engine.
- **Files:** `serverhub-ui/src/types/index.ts` (AlertRule interface), `serverhub-ui/src/hooks/useMockMetrics.ts:53` (comment: "real API endpoints are future work")
- **Work needed:**
  - Add alert rule storage (JSON file or embedded SQLite)
  - Add `/api/alerts` CRUD endpoints to the agent
  - Implement threshold evaluation in the collector loop
  - Wire the frontend to the real endpoints instead of mock data

### Notifications (Email / Push)
- **Status:** `ServerConfig.notifications` interface is fully defined in the frontend types but nothing sends alerts.
- **Files:** `serverhub-ui/src/types/index.ts:214-221`
- **Work needed:**
  - SMTP email sender in the Go agent
  - Push notification webhook support (e.g. ntfy, Gotify, Pushover)
  - Settings UI already has the fields — just needs to call real endpoints

---

## Medium Priority

### Service Control (start / stop / restart)
- **Status:** Services are displayed with status (active/inactive/failed) but there are no control actions.
- **Files:** `serverhub-ui/src/components/ServicesWidget.tsx`, `serverhub-agent/internal/api/server.go`
- **Work needed:**
  - Add `POST /api/services/:name/action` endpoint wrapping `systemctl`
  - Add start/stop/restart buttons to `ServicesView` and `ServicesWidget`
  - Mirror the same actions in the Android `ServicesScreen`

### Docker Container Management
- **Status:** Container list is displayed (read-only). No start/stop/inspect actions exist.
- **Files:** `serverhub-ui/src/components/DockerWidget.tsx`, `serverhub-ui/src/pages/DockerView.tsx`
- **Work needed:**
  - Add Docker client to the agent (talk to `/var/run/docker.sock`)
  - Endpoints: `POST /api/docker/:id/start|stop|restart`, `GET /api/docker/:id/logs`
  - Action buttons in `DockerView` and `DockerWidget`

### Cron Job Execution History
- **Status:** `CronExecution` type is defined in the frontend but the backend does not track execution results.
- **Files:** `serverhub-ui/src/types/index.ts` (CronExecution), `serverhub-agent/internal/api/cron.go`
- **Work needed:**
  - Hook into cron output (read from syslog or wrap cron commands)
  - Store execution records with stdout, exit code, and duration
  - Add `GET /api/cron/:id/history` endpoint
  - Display history in `CronManager.tsx`

### File Upload / Write Operations
- **Status:** File browser is read-only. The API exposes `GET /api/files` and `GET /api/files/read` only.
- **Files:** `serverhub-agent/internal/api/files.go`, `serverhub-ui/src/components/SFTPClient.tsx`
- **Work needed:**
  - `POST /api/files/upload` (multipart form)
  - `PUT /api/files/write` (overwrite text content)
  - `DELETE /api/files?path=` (delete a file or empty directory)
  - Update `SFTPClient.tsx` to use real endpoints instead of mock data

---

## Low Priority

### True SSH Support
- **Status:** The web terminal connects to a local PTY shell (`/bin/bash`), not SSH. The `SSHTerminal.tsx` component uses mock data.
- **Files:** `serverhub-agent/internal/api/terminal.go`, `serverhub-ui/src/components/SSHTerminal.tsx`
- **Work needed:**
  - Decide: keep local PTY only, or add outbound SSH to remote hosts via `golang.org/x/crypto/ssh`
  - If outbound SSH: add connection profiles to config, pass host/user/key to agent
  - Replace mock data in `SSHTerminal.tsx` with real WebSocket session

### Multi-Server / Central Management
- **Status:** `ServerConfig.future.central_management` is a boolean placeholder. The platform is single-agent only.
- **Files:** `serverhub-ui/src/types/index.ts:227-229`
- **Work needed:**
  - Design a hub-and-spoke model (one coordinator, many agents)
  - Server list management in the UI and Android app
  - Aggregated dashboard across servers

### SFTP Backend
- **Status:** `SFTPClient.tsx` renders a file manager UI with mock entries. There is no SFTP protocol support in the agent.
- **Files:** `serverhub-ui/src/components/SFTPClient.tsx`, `serverhub-agent/internal/api/files.go`
- **Work needed:**
  - Either extend the HTTP files API (upload, rename, delete) — simpler
  - Or add a real SFTP subsystem via `github.com/pkg/sftp` — more compatible with standard clients

### Android Feature Parity
- **Status:** The Android app covers most features but may lag behind as new agent endpoints are added.
- **Files:** `serverhub-android/app/src/main/java/com/serverhub/android/`
- **Work needed:** Update `ServerHubApi.kt` and add screens as new backend endpoints land (service control, Docker management, alert rules, file upload).

---

## Code Quality / Tech Debt

- **Default credentials** — `admin/admin` in `config.go` defaults. First-run setup wizard or forced password change on first login would be safer.
- **Single-user sessions** — The session store in `api/server.go` is an in-memory map. Multiple concurrent logins from different browsers can conflict; consider a proper session store.
- **No HTTPS by default** — TLS config exists but is off by default. Add a self-signed cert generation step to the installer or the Makefile.
- **Error handling in `exec.go`** — Command injection is prevented by `exec.CommandContext` with argument separation, but user-supplied paths in the files API should be validated to prevent path traversal.
