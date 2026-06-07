# ServerHub TODO

Tracking list of features that are scaffolded/placeholder in the UI but still
need real backend wiring or implementation. Update this file as items are
completed.

## Dashboard widgets
- [ ] Bandwidth Monitor widget — currently a "Coming Soon" placeholder
- [ ] Log Viewer widget — currently a "Coming Soon" placeholder
- [ ] Firewall Rules widget — currently a "Coming Soon" placeholder
- [x] Widget detail modal "settings" (gear icon) button — now navigates to the
      Settings page; a proper per-widget config panel is still future work

## Logs
- [ ] Real-time log streaming over WebSocket (LogsView currently renders a
      hardcoded `SAMPLE_LOGS` array and shows a "Preview" / "sample data" banner)

## Security Center
SecurityView currently only shows a roadmap of planned features — none are implemented yet:
- [ ] Firewall Manager (view/manage iptables / nftables rules, hit counters, traffic stats)
- [ ] Fail2ban Monitor (banned IPs, jail status, intrusion attempts)
- [ ] SSH Key Manager (manage `authorized_keys`, rotate keys, audit access)
- [ ] Audit Log (chronological trail of dashboard actions)
- [ ] Vulnerability Scanner (scan packages against known CVEs)
- [ ] CIS Benchmark compliance checks

## Process / Service / Container management
- [x] Wire up Service control actions (Start/Stop/Restart) in ServicesView —
      now calls `POST /api/services/action` (new agent endpoint, runs `systemctl`)
- [x] Wire up Docker container actions (Start/Stop/Restart/Remove) in
      DockerView — now calls `POST /api/docker/action` (new agent endpoint, runs `docker`)
- [ ] Docker "Logs" button — still a placeholder; needs a streaming log endpoint
      (likely WebSocket, similar to metrics) before it can be wired up

## SSH Terminal
- [x] Real PTY backend — `GET/WS /api/terminal/ws` spawns a login shell via
      `creack/pty`, streaming stdin/stdout/resize over a WebSocket
      (`serverhub-agent/internal/api/terminal.go`). The frontend now uses
      `xterm.js` (`@xterm/xterm` + `@xterm/addon-fit`) instead of the old
      hardcoded `DEMO_RESPONSES` mock — full rewrite of `SSHTerminal.tsx`.
      Note: this gives a real shell *on the agent's host* (there's no remote
      SSH multiplexing — "SSH Terminal" means "terminal on this server",
      consistent with how Service/Docker actions already run local commands).
- [ ] Multiple real *remote* SSH targets (the tab UI previously implied
      connecting to different hosts like `db-replica-02`) — out of scope for
      now; each tab currently opens a session on the agent's own host.

## Alerts & Cron
- [x] Alerts are now derived live from real metrics + alert rule thresholds
      (`src/lib/alertEngine.ts`, wired into `useMockMetrics.ts`) instead of
      static mock data — e.g. CPU/memory/disk crossing a threshold, a service
      entering `failed`, or a container stopping all generate/auto-resolve
      alert entries in real time.
- [x] Cron jobs are now read from the real system — `GET /api/cron`
      (`serverhub-agent/internal/api/cron.go`) parses `/etc/crontab`,
      `/etc/cron.d/*`, and per-user crontabs in `/var/spool/cron/crontabs/`.
- [ ] Cron execution history (`lastRun`/`lastStatus`) and computed
      `nextRun` times are not available yet — the agent doesn't track job
      runs over time, and computing next-run requires a cron-expression
      parser. These fields render as "—" / "never" until that's built.
- [ ] Cron job CRUD (create/edit/delete/run-now buttons in `CronManager.tsx`)
      is still UI-only — writing crontabs safely (locking, validation,
      per-user permissions) is a separate, riskier follow-up.

## Versioning
- [ ] Keep `serverhub-ui/package.json` version and the footer string in
      `Login.tsx` in sync with the agent's git-tag-derived `main.version`
      build flag, and bump on every release so users can confirm they're
      running the latest build (especially important for installs accessed
      from a phone browser where caching can hide stale versions)
