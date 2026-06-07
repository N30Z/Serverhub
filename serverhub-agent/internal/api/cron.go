package api

import (
	"bufio"
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// cronJob mirrors the subset of the frontend's CronJob shape that the agent
// can determine by reading crontabs directly. Execution history (lastRun /
// lastStatus) and computed next-run times require tracking job runs over
// time, which the agent doesn't do yet — those fields are left empty/null.
type cronJob struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Schedule    string  `json:"schedule"`
	Command     string  `json:"command"`
	User        string  `json:"user"`
	Enabled     bool    `json:"enabled"`
	LastRun     *string `json:"lastRun"`
	NextRun     string  `json:"nextRun"`
	LastStatus  *string `json:"lastStatus"`
	Description string  `json:"description"`
}

func (s *Server) handleCronList(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"jobs": collectCronJobs()}) //nolint:errcheck
}

func collectCronJobs() []cronJob {
	jobs := []cronJob{}
	seq := 0
	nextID := func() string { seq++; return strconv.Itoa(seq) }

	// System-wide crontab: "min hour dom month dow user command"
	if lines, err := readLines("/etc/crontab"); err == nil {
		for _, line := range lines {
			if job, ok := parseCronLine(line, true, "", "/etc/crontab"); ok {
				job.ID = nextID()
				jobs = append(jobs, job)
			}
		}
	}

	// Drop-in system crontabs, same format as /etc/crontab
	if entries, err := os.ReadDir("/etc/cron.d"); err == nil {
		for _, e := range entries {
			if e.IsDir() {
				continue
			}
			path := filepath.Join("/etc/cron.d", e.Name())
			lines, err := readLines(path)
			if err != nil {
				continue
			}
			for _, line := range lines {
				if job, ok := parseCronLine(line, true, "", filepath.Base(path)); ok {
					job.ID = nextID()
					jobs = append(jobs, job)
				}
			}
		}
	}

	// Per-user crontabs: "min hour dom month dow command" (no user field — taken from filename)
	if entries, err := os.ReadDir("/var/spool/cron/crontabs"); err == nil {
		for _, e := range entries {
			if e.IsDir() {
				continue
			}
			user := e.Name()
			lines, err := readLines(filepath.Join("/var/spool/cron/crontabs", user))
			if err != nil {
				continue
			}
			for _, line := range lines {
				if job, ok := parseCronLine(line, false, user, ""); ok {
					job.ID = nextID()
					jobs = append(jobs, job)
				}
			}
		}
	}

	return jobs
}

func readLines(path string) ([]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var lines []string
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		lines = append(lines, sc.Text())
	}
	return lines, sc.Err()
}

// parseCronLine parses one crontab line. hasUserField selects the
// "/etc/crontab"-style format (schedule, user, command) vs. the per-user
// crontab format (schedule, command — user supplied via defaultUser).
// Returns ok=false for comments, blank lines, and env-var assignments
// (e.g. "PATH=/usr/bin", "MAILTO=root").
func parseCronLine(line string, hasUserField bool, defaultUser, source string) (cronJob, bool) {
	line = strings.TrimSpace(line)
	if line == "" || strings.HasPrefix(line, "#") {
		return cronJob{}, false
	}

	fields := strings.Fields(line)
	if len(fields) < 2 {
		return cronJob{}, false
	}

	var schedule string
	var rest []string
	switch {
	case strings.HasPrefix(fields[0], "@"):
		schedule = fields[0]
		rest = fields[1:]
	case len(fields) >= 5 && looksLikeCronField(fields[0]):
		schedule = strings.Join(fields[0:5], " ")
		rest = fields[5:]
	default:
		return cronJob{}, false
	}

	user := defaultUser
	if hasUserField {
		if len(rest) < 1 {
			return cronJob{}, false
		}
		user = rest[0]
		rest = rest[1:]
	}
	if len(rest) == 0 {
		return cronJob{}, false
	}
	command := strings.Join(rest, " ")

	return cronJob{
		Name:        deriveJobName(command),
		Schedule:    schedule,
		Command:     command,
		User:        user,
		Enabled:     true,
		LastRun:     nil,
		NextRun:     "—",
		LastStatus:  nil,
		Description: source,
	}, true
}

// looksLikeCronField reports whether f could be a standard cron schedule
// field (digits, *, /, -, ,) — used to distinguish schedules from env-var
// assignments like "PATH=/usr/bin:/bin" which would otherwise be mistaken
// for the first column.
func looksLikeCronField(f string) bool {
	if f == "" {
		return false
	}
	for _, r := range f {
		if !(r == '*' || r == '/' || r == '-' || r == ',' || (r >= '0' && r <= '9')) {
			return false
		}
	}
	return true
}

// deriveJobName picks a human-friendly label from the command line. Many
// real-world cron entries start with shell guards (e.g. "test -e ... || ..."
// or "[ -x ... ] && ..."), so prefer the first absolute-path token — that's
// usually the actual script/binary being run — falling back to the first word.
func deriveJobName(command string) string {
	fields := strings.Fields(command)
	if len(fields) == 0 {
		return command
	}
	for _, f := range fields {
		if strings.HasPrefix(f, "/") {
			return filepath.Base(f)
		}
	}
	return filepath.Base(fields[0])
}
