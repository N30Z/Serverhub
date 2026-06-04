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
		sessions:  make(map[string]time.Time),
		clients:   make(map[*wsClient]struct{}),
	}
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
	mux.HandleFunc("/api/files", s.withAuth(s.handleFiles))
	mux.HandleFunc("/api/exec", s.withAuth(s.handleExec))
	mux.HandleFunc("/api/cron/", s.withAuth(s.handleCronByID))
	mux.HandleFunc("/api/cron", s.withAuth(s.handleCron))
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
	expiry := time.Now().Add(time.Duration(s.cfg.Auth.SessionTimeout) * time.Second)
	s.sessionMu.Lock()
	s.sessions[token] = expiry
	s.sessionMu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": token}) //nolint:errcheck
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	token := extractToken(r)
	s.sessionMu.Lock()
	delete(s.sessions, token)
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
