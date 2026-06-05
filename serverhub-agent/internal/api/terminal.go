package api

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"sync"

	"github.com/creack/pty"
	"github.com/gorilla/websocket"
)

// terminalHTML is served at GET /terminal and contains a self-contained xterm.js
// terminal that connects back to /api/terminal via WebSocket.
const terminalHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
  <title>ServerHub Terminal</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#t{width:100%;height:100%;background:#0d1117;overflow:hidden}
  </style>
</head>
<body>
  <div id="t"></div>
  <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
  <script>
  const term = new Terminal({
    cursorBlink:true, fontSize:13,
    fontFamily:'"JetBrains Mono",Menlo,Monaco,"Courier New",monospace',
    theme:{
      background:'#0d1117',foreground:'#e6edf3',cursor:'#58a6ff',
      black:'#484f58',red:'#f85149',green:'#3fb950',yellow:'#d29922',
      blue:'#58a6ff',magenta:'#bc8cff',cyan:'#39c5cf',white:'#b1bac4',
      brightBlack:'#6e7681',brightRed:'#ff7b72',brightGreen:'#56d364',
      brightYellow:'#e3b341',brightBlue:'#79c0ff',brightMagenta:'#d2a8ff',
      brightCyan:'#56d4dd',brightWhite:'#f0f6fc'
    }
  });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.open(document.getElementById('t'));
  fit.fit();

  const token = new URLSearchParams(location.search).get('token')||'';
  const wsProto = location.protocol==='https:'?'wss:':'ws:';
  const wsUrl = wsProto+'//'+location.host+'/api/terminal?token='+encodeURIComponent(token);
  let ws;

  function sendResize(){
    if(ws&&ws.readyState===1)
      ws.send(JSON.stringify({type:'resize',cols:term.cols,rows:term.rows}));
  }

  function connect(){
    ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    ws.onopen  = () => sendResize();
    ws.onmessage = e => term.write(e.data instanceof ArrayBuffer ? new Uint8Array(e.data) : e.data);
    ws.onclose = () => term.write('\r\n\x1b[33m[Connection closed — tap to reconnect]\x1b[0m\r\n');
    ws.onerror = () => term.write('\r\n\x1b[31m[WebSocket error]\x1b[0m\r\n');
  }

  term.onData(d => { if(ws&&ws.readyState===1) ws.send(d); });

  const ro = new ResizeObserver(()=>{ fit.fit(); sendResize(); });
  ro.observe(document.getElementById('t'));
  window.addEventListener('resize',()=>{ fit.fit(); sendResize(); });

  document.body.addEventListener('click',()=>{ if(!ws||ws.readyState>1) connect(); });
  connect();
  </script>
</body>
</html>`

type ptyResizeMsg struct {
	Type string `json:"type"`
	Cols uint16 `json:"cols"`
	Rows uint16 `json:"rows"`
}

// handleTerminalPage serves the xterm.js terminal page.
func (s *Server) handleTerminalPage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(terminalHTML)) //nolint:errcheck
}

// handleTerminalWS upgrades the connection to a WebSocket and relays a real PTY session.
func (s *Server) handleTerminalWS(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if !s.validToken(token) {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("terminal ws upgrade: %v", err)
		return
	}
	defer conn.Close()

	shell := os.Getenv("SHELL")
	if shell == "" {
		if _, err := os.Stat("/bin/bash"); err == nil {
			shell = "/bin/bash"
		} else {
			shell = "/bin/sh"
		}
	}

	cmd := exec.Command(shell, "-l")
	cmd.Env = append(os.Environ(), "TERM=xterm-256color", "COLORTERM=truecolor")

	ptmx, err := pty.Start(cmd)
	if err != nil {
		log.Printf("pty start: %v", err)
		conn.WriteMessage(websocket.TextMessage, []byte("failed to start shell: "+err.Error()+"\r\n")) //nolint:errcheck
		return
	}
	defer func() {
		ptmx.Close()
		if cmd.Process != nil {
			cmd.Process.Kill() //nolint:errcheck
		}
		cmd.Wait() //nolint:errcheck
	}()

	var once sync.Once
	done := make(chan struct{})

	// PTY stdout → WebSocket
	go func() {
		defer once.Do(func() { close(done) })
		buf := make([]byte, 4096)
		for {
			n, err := ptmx.Read(buf)
			if n > 0 {
				if werr := conn.WriteMessage(websocket.BinaryMessage, buf[:n]); werr != nil {
					return
				}
			}
			if err != nil {
				if err != io.EOF {
					log.Printf("pty read: %v", err)
				}
				return
			}
		}
	}()

	// WebSocket → PTY stdin (or resize control message)
	conn.SetReadLimit(32 * 1024)
	for {
		msgType, data, err := conn.ReadMessage()
		if err != nil {
			break
		}
		if msgType == websocket.TextMessage {
			var msg ptyResizeMsg
			if json.Unmarshal(data, &msg) == nil && msg.Type == "resize" && msg.Cols > 0 && msg.Rows > 0 {
				pty.Setsize(ptmx, &pty.Winsize{ //nolint:errcheck
					Cols: msg.Cols,
					Rows: msg.Rows,
					X:    msg.Cols * 8,
					Y:    msg.Rows * 16,
				})
				continue
			}
		}
		if _, err := ptmx.Write(data); err != nil {
			break
		}
	}

	once.Do(func() { close(done) })
	<-done
}
