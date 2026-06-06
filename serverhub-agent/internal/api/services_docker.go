package api

import (
	"context"
	"encoding/json"
	"net/http"
	"os/exec"
	"strings"
	"time"
)

// ── Service control ────────────────────────────────────────────────────────────

func (s *Server) handleServiceAction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// /api/services/:name/action → extract name
	p := strings.TrimPrefix(r.URL.Path, "/api/services/")
	p = strings.TrimSuffix(p, "/action")
	name := strings.TrimSpace(p)
	if name == "" || strings.ContainsAny(name, "/;\\") {
		http.Error(w, "invalid service name", http.StatusBadRequest)
		return
	}

	var body struct {
		Action string `json:"action"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	switch body.Action {
	case "start", "stop", "restart":
	default:
		http.Error(w, "action must be start, stop, or restart", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	out, err := exec.CommandContext(ctx, "systemctl", body.Action, name).CombinedOutput()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": strings.TrimSpace(string(out))}) //nolint:errcheck
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"}) //nolint:errcheck
}

// ── Docker management ─────────────────────────────────────────────────────────

func (s *Server) handleDockerAction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := dockerContainerID(r.URL.Path, "/action")
	if id == "" {
		http.Error(w, "container id required", http.StatusBadRequest)
		return
	}

	var body struct {
		Action string `json:"action"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	var dockerCmd string
	switch body.Action {
	case "start":
		dockerCmd = "start"
	case "stop":
		dockerCmd = "stop"
	case "restart":
		dockerCmd = "restart"
	case "remove":
		dockerCmd = "rm"
	default:
		http.Error(w, "action must be start, stop, restart, or remove", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	out, err := exec.CommandContext(ctx, "docker", dockerCmd, id).CombinedOutput()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": strings.TrimSpace(string(out))}) //nolint:errcheck
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"}) //nolint:errcheck
}

func (s *Server) handleDockerLogs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := dockerContainerID(r.URL.Path, "/logs")
	if id == "" {
		http.Error(w, "container id required", http.StatusBadRequest)
		return
	}

	tail := r.URL.Query().Get("tail")
	if tail == "" {
		tail = "100"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	out, err := exec.CommandContext(ctx, "docker", "logs", "--tail", tail, "--timestamps", id).CombinedOutput()
	if err != nil {
		http.Error(w, strings.TrimSpace(string(out)), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Write(out) //nolint:errcheck
}

func dockerContainerID(path, suffix string) string {
	p := strings.TrimPrefix(path, "/api/docker/")
	if !strings.HasSuffix(p, suffix) {
		return ""
	}
	id := strings.TrimSuffix(p, suffix)
	if strings.ContainsAny(id, "/;\\") {
		return ""
	}
	return id
}
