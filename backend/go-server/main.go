package main

import (
	"fmt"
	"net/http"
	"github.com/xlzior/goats/backend/go-server/handler"
)

func main() {
	
	// Define the endpoint handler functions
	http.HandleFunc("/parse", handler.ParseHandler)

	// Start the server on port 8080
	fmt.Println("Go server listening on port 8080...")
	http.ListenAndServe(":8080", nil)

}