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
- [ ] Build a real SSH/PTY backend — currently `SSHTerminal.tsx` is fully
      mocked (hardcoded `DEMO_RESPONSES` map, no agent connection at all).
      This is a sizeable feature: needs a PTY-allocating WebSocket endpoint
      in the Go agent (stdin/stdout streaming + resize handling) and a
      frontend rewrite (e.g. xterm.js) to replace the mock terminal.
      The previously-seen `pty read: read /dev/ptmx: input/output error`
      does not correspond to any code currently in the agent — likely from
      an earlier prototype; revisit once the real PTY handler is built.

## Alerts & Cron
- [ ] Replace mock data seeding with real backend API endpoints
      (see `useMockMetrics.ts`: "Always seed alerts/cron from mock data —
      real API endpoints are future work")

## Versioning
- [ ] Keep `serverhub-ui/package.json` version and the footer string in
      `Login.tsx` in sync with the agent's git-tag-derived `main.version`
      build flag, and bump on every release so users can confirm they're
      running the latest build (especially important for installs accessed
      from a phone browser where caching can hide stale versions)
