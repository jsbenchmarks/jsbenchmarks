package handlers

import (
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

func Assets(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimPrefix(r.URL.Path, "/")
	if name == "" {
		name = "index.html"
	}
	fullPath := path.Join("assets", name)
	if _, er := os.Stat(fullPath); os.IsNotExist(er) {
		fullPath = path.Join("assets", "index.html")
	}
	switch filepath.Ext(fullPath) {
	case ".js", ".css":
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	case ".png", ".svg":
		w.Header().Set("Cache-Control", "public, max-age=3600")
	case ".json":
		w.Header().Set("Cache-Control", "public, max-age=60")
	}
	http.ServeFile(w, r, fullPath)
}
