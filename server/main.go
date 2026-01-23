package main

import (
	"main/handlers"
	"main/log"
	"net/http"
	"time"
)

func main() {
	srv := createServer()
	panic(srv.ListenAndServe())
}

func createServer() *http.Server {
	mux := http.NewServeMux()

	mux.HandleFunc("/", log.Middleware(handlers.Assets))

	return &http.Server{
		Addr:         ":10003",
		Handler:      mux,
		ReadTimeout:  time.Second * 10,
		WriteTimeout: time.Second * 60,
	}
}
