package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"regexp"
	"strings"
	"time"
)

// Names/IDs are validated against these patterns before being passed to exec —
// commands are run via exec.CommandContext (no shell), so this guards against
// malformed input rather than injection, but keeps the surface tight either way.
var (
	serviceNameRe = regexp.MustCompile(`^[a-zA-Z0-9_.@:-]+$`)
	dockerIDRe    = regexp.MustCompile(`^[a-zA-Z0-9_.-]+$`)
)

var serviceActions = map[string]string{
	"start":   "start",
	"stop":    "stop",
	"restart": "restart",
}

var dockerActions = map[string]string{
	"start":   "start",
	"stop":    "stop",
	"restart": "restart",
	"remove":  "rm",
}

func (s *Server) handleServiceAction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var body struct {
		Name   string `json:"name"`
		Action string `json:"action"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	cmdAction, ok := serviceActions[body.Action]
	if !ok {
		http.Error(w, "unsupported action", http.StatusBadRequest)
		return
	}
	if body.Name == "" || !serviceNameRe.MatchString(body.Name) {
		http.Error(w, "invalid service name", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()

	unit := body.Name + ".service"
	out, err := exec.CommandContext(ctx, "systemctl", cmdAction, unit).CombinedOutput()
	if err != nil {
		http.Error(w, fmt.Sprintf("%s %s failed: %s", cmdAction, unit, strings.TrimSpace(string(out))), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"}) //nolint:errcheck
}

func (s *Server) handleDockerAction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var body struct {
		ID     string `json:"id"`
		Action string `json:"action"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	cmdAction, ok := dockerActions[body.Action]
	if !ok {
		http.Error(w, "unsupported action", http.StatusBadRequest)
		return
	}
	if body.ID == "" || !dockerIDRe.MatchString(body.ID) {
		http.Error(w, "invalid container id", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	args := []string{cmdAction}
	if cmdAction == "rm" {
		args = append(args, "-f")
	}
	args = append(args, body.ID)

	out, err := exec.CommandContext(ctx, "docker", args...).CombinedOutput()
	if err != nil {
		http.Error(w, fmt.Sprintf("%s %s failed: %s", body.Action, body.ID, strings.TrimSpace(string(out))), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"}) //nolint:errcheck
}
