package main

import (
	"fmt"
	"net/http"
	"github.com/xlzior/goats/backend/go-server/handler"
	"github.com/gorilla/handlers"
)

func main() {

	// Define the endpoint handler functions
	http.HandleFunc("/parse", handler.ParseHandler)

  // CORS middleware configuration
  corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
	)

	// Start the server on port 8080
	fmt.Println("Go server listening on port 8080...")
	http.ListenAndServe(":8080", corsHandler(http.DefaultServeMux))

}