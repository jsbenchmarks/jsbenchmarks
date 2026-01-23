package log

import (
	"log/slog"
	"net/http"
	"os"
	"time"
)

type responseWriter struct {
	w      http.ResponseWriter
	status int
}

func (w *responseWriter) WriteHeader(status int) {
	w.status = status
	w.w.WriteHeader(status)
}

func (w *responseWriter) Write(b []byte) (int, error) {
	return w.w.Write(b)
}

func (w *responseWriter) Header() http.Header {
	return w.w.Header()
}

var _ http.ResponseWriter = (*responseWriter)(nil)

var logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
	Level: slog.LevelDebug,
	ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
		if a.Key == slog.TimeKey {
			return slog.Attr{}
		}
		return a
	},
}))

func Middleware(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{w: w}
		handler(rw, r)
		if rw.status == 0 {
			rw.status = http.StatusOK
		}
		logger.Info("request",
			slog.String("ip", r.Header.Get("CF-Connecting-IP")),
			slog.String("country", r.Header.Get("CF-IPCountry")),
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", rw.status),
			slog.Duration("latency", time.Since(start).Round(time.Microsecond)),
		)
	}
}
