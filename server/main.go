package main

import (
	"main/handlers"
	"main/log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/", log.Middleware(handlers.Assets))

	panic(http.ListenAndServe(":10003", mux))
}
