package api

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"time"

	"github.com/creack/pty"
	"github.com/gorilla/websocket"
)

// terminalMessage is the control-frame protocol used over the terminal
// WebSocket. Clients send JSON frames; the server streams raw PTY output back
// as text frames so it can be written directly into an xterm.js instance.
type terminalMessage struct {
	Type string `json:"type"` // "input" | "resize"
	Data string `json:"data,omitempty"`
	Cols int    `json:"cols,omitempty"`
	Rows int    `json:"rows,omitempty"`
}

func (s *Server) handleTerminalWS(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if !s.validToken(token) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	cols := queryInt(r, "cols", 80)
	rows := queryInt(r, "rows", 24)

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("terminal ws upgrade: %v", err)
		return
	}
	defer conn.Close()

	shell := loginShell()
	cmd := exec.Command(shell, "-l")
	cmd.Env = append(os.Environ(), "TERM=xterm-256color")

	ptmx, err := pty.StartWithSize(cmd, &pty.Winsize{Rows: uint16(rows), Cols: uint16(cols)})
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("\r\n\x1b[31mfailed to start shell: "+err.Error()+"\x1b[0m\r\n")) //nolint:errcheck
		return
	}
	defer func() {
		ptmx.Close()
		_ = cmd.Process.Kill()
		_, _ = cmd.Process.Wait()
	}()

	done := make(chan struct{})

	// PTY → WebSocket
	go func() {
		defer close(done)
		buf := make([]byte, 4096)
		for {
			n, err := ptmx.Read(buf)
			if n > 0 {
				conn.SetWriteDeadline(time.Now().Add(10 * time.Second)) //nolint:errcheck
				if werr := conn.WriteMessage(websocket.TextMessage, buf[:n]); werr != nil {
					return
				}
			}
			if err != nil {
				return
			}
		}
	}()

	// WebSocket → PTY
	for {
		_, raw, err := conn.ReadMessage()
		if err != nil {
			break
		}
		var msg terminalMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			continue
		}
		switch msg.Type {
		case "input":
			ptmx.Write([]byte(msg.Data)) //nolint:errcheck
		case "resize":
			if msg.Cols > 0 && msg.Rows > 0 {
				pty.Setsize(ptmx, &pty.Winsize{Rows: uint16(msg.Rows), Cols: uint16(msg.Cols)}) //nolint:errcheck
			}
		}
	}

	<-done
}

func loginShell() string {
	if sh := os.Getenv("SHELL"); sh != "" {
		if _, err := exec.LookPath(sh); err == nil {
			return sh
		}
	}
	for _, candidate := range []string{"bash", "sh"} {
		if path, err := exec.LookPath(candidate); err == nil {
			return path
		}
	}
	return "/bin/sh"
}

func queryInt(r *http.Request, key string, fallback int) int {
	if v, err := strconv.Atoi(r.URL.Query().Get(key)); err == nil && v > 0 {
		return v
	}
	return fallback
}
