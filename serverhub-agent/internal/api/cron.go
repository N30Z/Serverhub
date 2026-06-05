package api

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

const (
	cronStateFile = "/etc/serverhub/cronjobs.json"
	cronTabFile   = "/etc/cron.d/serverhub"
)

type cronJob struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Command     string `json:"command"`
	Schedule    string `json:"schedule"`
	User        string `json:"user"`
	Description string `json:"description"`
	Enabled     bool   `json:"enabled"`
}

var cronMu sync.Mutex

func (s *Server) handleCron(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.cronList(w, r)
	case http.MethodPost:
		s.cronCreate(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleCronByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/cron/")
	if id == "" {
		http.Error(w, "id required", http.StatusBadRequest)
		return
	}
	switch r.Method {
	case http.MethodPut:
		s.cronUpdate(w, r, id)
	case http.MethodDelete:
		s.cronDelete(w, r, id)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) cronList(w http.ResponseWriter, r *http.Request) {
	jobs := loadCronJobs()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(jobs) //nolint:errcheck
}

func (s *Server) cronCreate(w http.ResponseWriter, r *http.Request) {
	var job cronJob
	if err := json.NewDecoder(r.Body).Decode(&job); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	job.ID = newCronID()
	if job.User == "" {
		job.User = "root"
	}

	cronMu.Lock()
	defer cronMu.Unlock()
	jobs := loadCronJobs()
	jobs = append(jobs, job)
	if err := saveCronJobs(jobs); err != nil {
		http.Error(w, fmt.Sprintf("save failed: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(job) //nolint:errcheck
}

func (s *Server) cronUpdate(w http.ResponseWriter, r *http.Request, id string) {
	var updated cronJob
	if err := json.NewDecoder(r.Body).Decode(&updated); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	updated.ID = id

	cronMu.Lock()
	defer cronMu.Unlock()
	jobs := loadCronJobs()
	found := false
	for i, j := range jobs {
		if j.ID == id {
			jobs[i] = updated
			found = true
			break
		}
	}
	if !found {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if err := saveCronJobs(jobs); err != nil {
		http.Error(w, fmt.Sprintf("save failed: %v", err), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated) //nolint:errcheck
}

func (s *Server) cronDelete(w http.ResponseWriter, r *http.Request, id string) {
	cronMu.Lock()
	defer cronMu.Unlock()
	jobs := loadCronJobs()
	newJobs := make([]cronJob, 0, len(jobs))
	for _, j := range jobs {
		if j.ID != id {
			newJobs = append(newJobs, j)
		}
	}
	if err := saveCronJobs(newJobs); err != nil {
		http.Error(w, fmt.Sprintf("save failed: %v", err), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func loadCronJobs() []cronJob {
	data, err := os.ReadFile(cronStateFile)
	if err != nil {
		return []cronJob{}
	}
	var jobs []cronJob
	if err := json.Unmarshal(data, &jobs); err != nil {
		return []cronJob{}
	}
	return jobs
}

func saveCronJobs(jobs []cronJob) error {
	if err := os.MkdirAll(filepath.Dir(cronStateFile), 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(jobs, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(cronStateFile, data, 0600); err != nil {
		return err
	}
	return writeCrontab(jobs)
}

func writeCrontab(jobs []cronJob) error {
	var sb strings.Builder
	sb.WriteString("# Managed by ServerHub — do not edit manually\n")
	sb.WriteString("SHELL=/bin/sh\n")
	sb.WriteString("PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin\n\n")
	for _, j := range jobs {
		if !j.Enabled {
			sb.WriteString(fmt.Sprintf("# (disabled) %s %s %s\n", j.Schedule, j.User, j.Command))
			continue
		}
		sb.WriteString(fmt.Sprintf("%s\t%s\t%s\n", j.Schedule, j.User, j.Command))
	}
	// Best-effort; /etc/cron.d/ may not be writable in all environments.
	if err := os.MkdirAll(filepath.Dir(cronTabFile), 0755); err != nil {
		return nil // non-fatal
	}
	_ = os.WriteFile(cronTabFile, []byte(sb.String()), 0644)
	return nil
}

func newCronID() string {
	b := make([]byte, 8)
	rand.Read(b) //nolint:errcheck
	return hex.EncodeToString(b)
}
