package main

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed dist
var dist embed.FS

func handler() http.Handler {

	fsys := fs.FS(dist)
	html, _ := fs.Sub(fsys, "dist")

	return http.FileServer(http.FS(html))
}

func main() {
	// http.Handle("/tmpfiles/", http.StripPrefix("/tmpfiles/", http.FileServer(http.Dir("/tmp"))))

	http.Handle("/", handler())
	http.ListenAndServe(":8080", nil)
}
