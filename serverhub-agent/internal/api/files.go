package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

type fileEntry struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	IsDir   bool   `json:"isDir"`
	Size    int64  `json:"size"`
	Mode    string `json:"mode"`
	ModTime int64  `json:"modTime"`
}

func (s *Server) handleFiles(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	path := r.URL.Query().Get("path")
	if path == "" {
		path = "/"
	}
	path = filepath.Clean(path)

	entries, err := os.ReadDir(path)
	if err != nil {
		http.Error(w, fmt.Sprintf("cannot read directory: %v", err), http.StatusBadRequest)
		return
	}

	result := make([]fileEntry, 0, len(entries))
	for _, e := range entries {
		info, err := e.Info()
		if err != nil {
			continue
		}
		result = append(result, fileEntry{
			Name:    e.Name(),
			Path:    filepath.Join(path, e.Name()),
			IsDir:   e.IsDir(),
			Size:    info.Size(),
			Mode:    info.Mode().String(),
			ModTime: info.ModTime().Unix(),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result) //nolint:errcheck
}

func (s *Server) handleFileRead(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	path := filepath.Clean(r.URL.Query().Get("path"))
	if path == "" || path == "." {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}

	info, err := os.Stat(path)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if info.IsDir() {
		http.Error(w, "path is a directory", http.StatusBadRequest)
		return
	}
	const maxSize = 1 << 20 // 1 MB
	if info.Size() > maxSize {
		http.Error(w, "file too large (max 1 MB)", http.StatusRequestEntityTooLarge)
		return
	}

	data, err := os.ReadFile(path)
	if err != nil {
		http.Error(w, fmt.Sprintf("cannot read file: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Write(data) //nolint:errcheck
}

func (s *Server) handleFileDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	path := filepath.Clean(r.URL.Query().Get("path"))
	if path == "" || path == "." || path == "/" {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}
	if err := os.Remove(path); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleFileMkdir(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	path := filepath.Clean(r.URL.Query().Get("path"))
	if path == "" || path == "." {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}
	if err := os.Mkdir(path, 0755); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (s *Server) handleFileUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	dir := filepath.Clean(r.URL.Query().Get("path"))
	if dir == "" || dir == "." {
		dir = "/tmp"
	}
	const maxUpload = 100 << 20 // 100 MB
	if err := r.ParseMultipartForm(maxUpload); err != nil {
		http.Error(w, "cannot parse form: "+err.Error(), http.StatusBadRequest)
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "no file in request", http.StatusBadRequest)
		return
	}
	defer file.Close()

	destPath := filepath.Join(dir, filepath.Base(header.Filename))
	out, err := os.Create(destPath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"path": destPath}) //nolint:errcheck
}

func (s *Server) handleFileWrite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	path := filepath.Clean(r.URL.Query().Get("path"))
	if path == "" || path == "." {
		http.Error(w, "path required", http.StatusBadRequest)
		return
	}
	const maxSize = 1 << 20 // 1 MB
	body, err := io.ReadAll(io.LimitReader(r.Body, maxSize+1))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if int64(len(body)) > maxSize {
		http.Error(w, "content too large (max 1 MB)", http.StatusRequestEntityTooLarge)
		return
	}
	if err := os.WriteFile(path, body, 0644); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
