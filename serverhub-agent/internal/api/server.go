package api

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"github.com/n30z/serverhub-agent/internal/collector"
	"github.com/n30z/serverhub-agent/internal/config"
)

// Server is the HTTP + WebSocket server.
type Server struct {
	cfg       *config.Config
	collector *collector.Collector
	webFS     fs.FS

	// auth sessions: token → expiry
	sessionMu sync.RWMutex
	sessions  map[string]time.Time

	// WebSocket clients
	clientMu sync.RWMutex
	clients  map[*wsClient]struct{}
}

type wsClient struct {
	conn *websocket.Conn
	send chan []byte
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  512,
	WriteBufferSize: 4096,
	CheckOrigin:     func(r *http.Request) bool { return true }, // allow any origin
}

func New(cfg *config.Config, coll *collector.Collector, webFS fs.FS) *Server {
	return &Server{
		cfg:       cfg,
		collector: coll,
		webFS:     webFS,
		sessions:  loadSessions(),
		clients:   make(map[*wsClient]struct{}),
	}
}

// sessionsStateFile persists login sessions across agent restarts so that
// clients (e.g. the Android app) stay logged in after a service restart/upgrade.
const sessionsStateFile = "/etc/serverhub/sessions.json"

func loadSessions() map[string]time.Time {
	sessions := make(map[string]time.Time)
	data, err := os.ReadFile(sessionsStateFile)
	if err != nil {
		return sessions
	}
	if err := json.Unmarshal(data, &sessions); err != nil {
		return make(map[string]time.Time)
	}
	now := time.Now()
	for token, expiry := range sessions {
		if now.After(expiry) {
			delete(sessions, token)
		}
	}
	return sessions
}

func saveSessions(sessions map[string]time.Time) {
	os.MkdirAll(filepath.Dir(sessionsStateFile), 0755) //nolint:errcheck
	data, _ := json.MarshalIndent(sessions, "", "  ")
	os.WriteFile(sessionsStateFile, data, 0600) //nolint:errcheck
}

// ListenAndServe starts the HTTP server and the WS broadcaster. Blocks until ctx is cancelled.
func (s *Server) ListenAndServe(ctx context.Context) error {
	// Start WS broadcaster: relay collector updates to all connected clients
	go func() {
		for {
			select {
			case data, ok := <-s.collector.Updates:
				if !ok {
					return
				}
				s.broadcast(data)
				if m := s.collector.LatestMetrics(); m != nil {
					go s.evaluateAlerts(m)
				}
			case <-ctx.Done():
				return
			}
		}
	}()

	// Start session cleanup goroutine
	go s.cleanSessions(ctx)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", s.handleHealth)
	mux.HandleFunc("/api/auth/login", s.handleLogin)
	mux.HandleFunc("/api/auth/logout", s.withAuth(s.handleLogout))
	mux.HandleFunc("/api/metrics", s.withAuth(s.handleMetrics))
	mux.HandleFunc("/api/files/read", s.withAuth(s.handleFileRead))
	mux.HandleFunc("/api/files/delete", s.withAuth(s.handleFileDelete))
	mux.HandleFunc("/api/files/upload", s.withAuth(s.handleFileUpload))
	mux.HandleFunc("/api/files/mkdir", s.withAuth(s.handleFileMkdir))
	mux.HandleFunc("/api/files/write", s.withAuth(s.handleFileWrite))
	mux.HandleFunc("/api/files", s.withAuth(s.handleFiles))
	mux.HandleFunc("/api/exec", s.withAuth(s.handleExec))
	mux.HandleFunc("/api/alerts/rules/", s.withAuth(s.handleAlertRuleByID))
	mux.HandleFunc("/api/alerts/rules", s.withAuth(s.handleAlertRules))
	mux.HandleFunc("/api/alerts/", s.withAuth(s.handleAlertAction))
	mux.HandleFunc("/api/alerts", s.withAuth(s.handleAlerts))
	mux.HandleFunc("/api/services/", s.withAuth(s.handleServiceAction))
	mux.HandleFunc("/api/docker/", s.withAuth(s.handleDockerMux))
	mux.HandleFunc("/api/cron/", s.withAuth(s.handleCronMux))
	mux.HandleFunc("/api/cron", s.withAuth(s.handleCron))
	mux.HandleFunc("/api/terminal", s.handleTerminalWS) // auth handled inside (token via query param)
	mux.HandleFunc("/terminal", s.handleTerminalPage)
	mux.HandleFunc("/ws", s.handleWS) // token via query param
	mux.Handle("/", s.spaHandler())

	addr := fmt.Sprintf("%s:%d", s.cfg.Server.Host, s.cfg.Server.Port)
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}

	srv := &http.Server{Handler: mux}

	go func() {
		<-ctx.Done()
		shutCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		srv.Shutdown(shutCtx) //nolint:errcheck
	}()

	if s.cfg.Server.TLS.Enabled {
		return srv.ServeTLS(ln, s.cfg.Server.TLS.CertFile, s.cfg.Server.TLS.KeyFile)
	}
	return srv.Serve(ln)
}

// ── handlers ─────────────────────────────────────────────────────────────────

func (s *Server) handleDockerMux(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/logs") {
		s.handleDockerLogs(w, r)
	} else if strings.HasSuffix(r.URL.Path, "/action") {
		s.handleDockerAction(w, r)
	} else {
		http.Error(w, "not found", http.StatusNotFound)
	}
}

func (s *Server) handleCronMux(w http.ResponseWriter, r *http.Request) {
	switch {
	case strings.HasSuffix(r.URL.Path, "/run"):
		s.handleCronRun(w, r)
	case strings.HasSuffix(r.URL.Path, "/history"):
		s.handleCronHistory(w, r)
	default:
		s.handleCronByID(w, r)
	}
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"}) //nolint:errcheck
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Client   string `json:"client"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	if body.Username != s.cfg.Auth.Username || body.Password != s.cfg.Auth.Password {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	token := newToken()
	// The Android app identifies itself so it can stay logged in indefinitely;
	// browser sessions keep the configured timeout (and can be force-expired by an admin).
	timeout := time.Duration(s.cfg.Auth.SessionTimeout) * time.Second
	if body.Client == "android" {
		timeout = 100 * 365 * 24 * time.Hour
	}
	expiry := time.Now().Add(timeout)
	s.sessionMu.Lock()
	s.sessions[token] = expiry
	saveSessions(s.sessions)
	s.sessionMu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": token}) //nolint:errcheck
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	token := extractToken(r)
	s.sessionMu.Lock()
	delete(s.sessions, token)
	saveSessions(s.sessions)
	s.sessionMu.Unlock()
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleMetrics(w http.ResponseWriter, r *http.Request) {
	data := s.collector.LatestJSON()
	if len(data) == 0 {
		http.Error(w, "metrics not ready", http.StatusServiceUnavailable)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(data) //nolint:errcheck
}

func (s *Server) handleWS(w http.ResponseWriter, r *http.Request) {
	// Auth via ?token= query param
	token := r.URL.Query().Get("token")
	if !s.validToken(token) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade: %v", err)
		return
	}

	client := &wsClient{conn: conn, send: make(chan []byte, 8)}
	s.addClient(client)

	// Send current metrics immediately on connect
	if data := s.collector.LatestJSON(); len(data) > 0 {
		select {
		case client.send <- data:
		default:
		}
	}

	go client.writePump(func() {
		s.removeClient(client)
	})
	client.readPump()
}

// ── WebSocket client pumps ─────────────────────────────────────────────────────

func (c *wsClient) writePump(onDone func()) {
	ticker := time.NewTicker(25 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
		onDone()
	}()
	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second)) //nolint:errcheck
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{}) //nolint:errcheck
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second)) //nolint:errcheck
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *wsClient) readPump() {
	c.conn.SetReadLimit(256)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second)) //nolint:errcheck
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	})
	for {
		if _, _, err := c.conn.ReadMessage(); err != nil {
			return
		}
	}
}

// ── broadcast ─────────────────────────────────────────────────────────────────

func (s *Server) broadcast(data []byte) {
	s.clientMu.RLock()
	defer s.clientMu.RUnlock()
	for c := range s.clients {
		select {
		case c.send <- data:
		default:
			// Slow client — drop the frame; it will catch up next tick.
		}
	}
}

func (s *Server) addClient(c *wsClient) {
	s.clientMu.Lock()
	s.clients[c] = struct{}{}
	s.clientMu.Unlock()
}

func (s *Server) removeClient(c *wsClient) {
	s.clientMu.Lock()
	delete(s.clients, c)
	s.clientMu.Unlock()
	close(c.send)
}

// ── SPA handler ───────────────────────────────────────────────────────────────

func (s *Server) spaHandler() http.Handler {
	fileServer := http.FileServer(http.FS(s.webFS))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p := strings.TrimPrefix(r.URL.Path, "/")
		if p == "" {
			p = "index.html"
		}
		if _, err := fs.Stat(s.webFS, p); err != nil {
			// Unknown path → serve index.html for client-side routing
			r2 := r.Clone(r.Context())
			r2.URL.Path = "/"
			fileServer.ServeHTTP(w, r2)
			return
		}
		fileServer.ServeHTTP(w, r)
	})
}

// ── auth middleware ───────────────────────────────────────────────────────────

func (s *Server) withAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !s.validToken(extractToken(r)) {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}

func (s *Server) validToken(token string) bool {
	if token == "" {
		return false
	}
	s.sessionMu.RLock()
	expiry, ok := s.sessions[token]
	s.sessionMu.RUnlock()
	return ok && time.Now().Before(expiry)
}

func (s *Server) cleanSessions(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			now := time.Now()
			s.sessionMu.Lock()
			for t, exp := range s.sessions {
				if now.After(exp) {
					delete(s.sessions, t)
				}
			}
			s.sessionMu.Unlock()
		case <-ctx.Done():
			return
		}
	}
}

// ── helpers ───────────────────────────────────────────────────────────────────

func extractToken(r *http.Request) string {
	hdr := r.Header.Get("Authorization")
	if strings.HasPrefix(hdr, "Bearer ") {
		return strings.TrimPrefix(hdr, "Bearer ")
	}
	return r.URL.Query().Get("token")
}

func newToken() string {
	b := make([]byte, 24)
	rand.Read(b) //nolint:errcheck
	return hex.EncodeToString(b)
}
