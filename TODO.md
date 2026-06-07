# ServerHub TODO

Tracking list of features that are scaffolded/placeholder in the UI but still
need real backend wiring or implementation. Update this file as items are
completed.

## Dashboard widgets
- [ ] Bandwidth Monitor widget — currently a "Coming Soon" placeholder
- [ ] Log Viewer widget — currently a "Coming Soon" placeholder
- [ ] Firewall Rules widget — currently a "Coming Soon" placeholder
- [ ] Widget detail modal "settings" (gear icon) button — non-functional placeholder

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
- [ ] Wire up Service control actions (Start/Stop/Restart) in ServicesView /
      ServicesWidget — buttons currently don't call the agent API
- [ ] Wire up Docker container actions (Start/Stop/Restart/Logs/Remove) in
      DockerView — buttons currently don't call the agent API

## SSH Terminal
- [ ] Investigate PTY backend error seen in agent logs:
      `pty read: read /dev/ptmx: input/output error`

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
