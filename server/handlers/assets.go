package handlers

import (
	"net/http"
	"path"
	"path/filepath"
	"strings"
)

func Assets(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimPrefix(r.URL.Path, "/")
	if name == "" {
		name = "index.html"
	}
	switch filepath.Ext(name) {
	case ".js", ".css":
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	case ".png", ".svg":
		w.Header().Set("Cache-Control", "public, max-age=3600")
	}
	http.ServeFile(w, r, path.Join("assets", name))
}
