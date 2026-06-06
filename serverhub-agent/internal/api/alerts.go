package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/n30z/serverhub-agent/internal/collector"
)

const (
	alertsStateFile = "/etc/serverhub/alerts.json"
	rulesStateFile  = "/etc/serverhub/alertrules.json"
)

type serverAlert struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Severity  string `json:"severity"`
	Title     string `json:"title"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	Resolved  bool   `json:"resolved"`
	Server    string `json:"server"`
}

type alertRule struct {
	ID          string  `json:"id"`
	Type        string  `json:"type"`
	Enabled     bool    `json:"enabled"`
	Threshold   float64 `json:"threshold"`
	Duration    int     `json:"duration"`
	NotifyEmail bool    `json:"notifyEmail"`
	NotifyPush  bool    `json:"notifyPush"`
	Description string  `json:"description"`
}

var alertMu sync.Mutex

func (s *Server) handleAlerts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	alerts := loadAlerts()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(alerts) //nolint:errcheck
}

func (s *Server) handleAlertAction(w http.ResponseWriter, r *http.Request) {
	// /api/alerts/:id/resolve
	p := strings.TrimPrefix(r.URL.Path, "/api/alerts/")
	parts := strings.SplitN(p, "/", 2)
	if len(parts) != 2 || parts[1] != "resolve" {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := parts[0]

	alertMu.Lock()
	defer alertMu.Unlock()
	alerts := loadAlerts()
	found := false
	for i, a := range alerts {
		if a.ID == id {
			alerts[i].Resolved = true
			found = true
			break
		}
	}
	if !found {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	saveAlerts(alerts)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleAlertRules(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		rules := loadAlertRules()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(rules) //nolint:errcheck
	case http.MethodPost:
		var rule alertRule
		if err := json.NewDecoder(r.Body).Decode(&rule); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		rule.ID = newCronID()
		alertMu.Lock()
		defer alertMu.Unlock()
		rules := loadAlertRules()
		rules = append(rules, rule)
		saveAlertRules(rules)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(rule) //nolint:errcheck
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleAlertRuleByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/alerts/rules/")
	if id == "" {
		http.Error(w, "id required", http.StatusBadRequest)
		return
	}
	switch r.Method {
	case http.MethodPut:
		var rule alertRule
		if err := json.NewDecoder(r.Body).Decode(&rule); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		rule.ID = id
		alertMu.Lock()
		defer alertMu.Unlock()
		rules := loadAlertRules()
		found := false
		for i, r2 := range rules {
			if r2.ID == id {
				rules[i] = rule
				found = true
				break
			}
		}
		if !found {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		saveAlertRules(rules)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(rule) //nolint:errcheck
	case http.MethodDelete:
		alertMu.Lock()
		defer alertMu.Unlock()
		rules := loadAlertRules()
		newRules := make([]alertRule, 0, len(rules))
		for _, r2 := range rules {
			if r2.ID != id {
				newRules = append(newRules, r2)
			}
		}
		saveAlertRules(newRules)
		w.WriteHeader(http.StatusNoContent)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// evaluateAlerts checks metrics against rules and fires alerts when thresholds are exceeded.
func (s *Server) evaluateAlerts(m *collector.Metrics) {
	rules := loadAlertRules()
	if len(rules) == 0 {
		return
	}

	alertMu.Lock()
	defer alertMu.Unlock()
	alerts := loadAlerts()

	hostname := m.Hostname
	if hostname == "" {
		hostname = "server"
	}

	var newAlerts []serverAlert
	for _, rule := range rules {
		if !rule.Enabled {
			continue
		}

		var value float64
		var title, message, severity string
		triggered := false

		switch rule.Type {
		case "cpu":
			if rule.Threshold > 0 {
				value = m.CPU.Usage
				if value >= rule.Threshold {
					triggered = true
					title = "CPU usage high"
					message = fmt.Sprintf("CPU usage is %.1f%% (threshold: %.0f%%)", value, rule.Threshold)
				}
			}
		case "memory":
			if rule.Threshold > 0 {
				value = m.Memory.Usage
				if value >= rule.Threshold {
					triggered = true
					title = "Memory usage high"
					message = fmt.Sprintf("Memory usage is %.1f%% (threshold: %.0f%%)", value, rule.Threshold)
				}
			}
		case "disk":
			if rule.Threshold > 0 {
				for _, d := range m.Disk {
					if d.Usage >= rule.Threshold {
						triggered = true
						value = d.Usage
						title = "Disk usage high"
						message = fmt.Sprintf("Disk %s usage is %.1f%% (threshold: %.0f%%)", d.Mountpoint, value, rule.Threshold)
						break
					}
				}
			}
		case "service":
			for _, svc := range m.Services {
				if svc.Status == "failed" {
					triggered = true
					title = fmt.Sprintf("Service %s failed", svc.Name)
					message = fmt.Sprintf("Service %s is in failed state", svc.Name)
					break
				}
			}
		}

		if !triggered {
			continue
		}

		if value >= 95 || rule.Type == "service" {
			severity = "critical"
		} else if value >= rule.Threshold*0.95 {
			severity = "warning"
		} else {
			severity = "warning"
		}

		// De-duplicate: skip if an unresolved alert of this type already exists
		alreadyActive := false
		for _, a := range alerts {
			if !a.Resolved && a.Type == rule.Type {
				alreadyActive = true
				break
			}
		}
		if alreadyActive {
			continue
		}

		a := serverAlert{
			ID:        newCronID(),
			Type:      rule.Type,
			Severity:  severity,
			Title:     title,
			Message:   message,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Resolved:  false,
			Server:    hostname,
		}
		newAlerts = append(newAlerts, a)
		go s.notify(a, rule)
	}

	if len(newAlerts) > 0 {
		alerts = append(alerts, newAlerts...)
		saveAlerts(alerts)
	}
}

func loadAlerts() []serverAlert {
	data, err := os.ReadFile(alertsStateFile)
	if err != nil {
		return []serverAlert{}
	}
	var alerts []serverAlert
	if err := json.Unmarshal(data, &alerts); err != nil {
		return []serverAlert{}
	}
	return alerts
}

func saveAlerts(alerts []serverAlert) {
	os.MkdirAll(filepath.Dir(alertsStateFile), 0755) //nolint:errcheck
	data, _ := json.MarshalIndent(alerts, "", "  ")
	os.WriteFile(alertsStateFile, data, 0600) //nolint:errcheck
}

func loadAlertRules() []alertRule {
	data, err := os.ReadFile(rulesStateFile)
	if err != nil {
		return defaultAlertRules()
	}
	var rules []alertRule
	if err := json.Unmarshal(data, &rules); err != nil {
		return defaultAlertRules()
	}
	return rules
}

func saveAlertRules(rules []alertRule) {
	os.MkdirAll(filepath.Dir(rulesStateFile), 0755) //nolint:errcheck
	data, _ := json.MarshalIndent(rules, "", "  ")
	os.WriteFile(rulesStateFile, data, 0600) //nolint:errcheck
}

func defaultAlertRules() []alertRule {
	return []alertRule{
		{ID: "cpu-high", Type: "cpu", Enabled: true, Threshold: 90, Duration: 5, NotifyEmail: false, NotifyPush: false, Description: "CPU usage above 90%"},
		{ID: "mem-high", Type: "memory", Enabled: true, Threshold: 90, Duration: 5, NotifyEmail: false, NotifyPush: false, Description: "Memory usage above 90%"},
		{ID: "disk-high", Type: "disk", Enabled: true, Threshold: 85, Duration: 0, NotifyEmail: false, NotifyPush: false, Description: "Disk usage above 85%"},
		{ID: "svc-failed", Type: "service", Enabled: true, Threshold: 0, Duration: 0, NotifyEmail: false, NotifyPush: false, Description: "Any service enters failed state"},
	}
}
