package handler

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"github.com/xlzior/goats/backend/go-server/parser"
)

type RequestBody struct {
	Program string `json:"program"`
}

type Response struct {
	Message string      `json:"message"`
	AST     interface{} `json:"ast,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func ParseHandler(w http.ResponseWriter, r *http.Request) {
	// Read the request body
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusBadRequest)
		return
	}

	// Parse the JSON request body
	var requestBody RequestBody
	err = json.Unmarshal(body, &requestBody)
	if err != nil {
		http.Error(w, "Error parsing JSON", http.StatusBadRequest)
		return
	}

	// Parse the program and get the AST or error
	parsedAST, err := parser.ParseProgram(requestBody.Program)
	if err != nil {
		response := Response{
			Message: "Error parsing program",
			Error:   err.Error(),
		}
		sendResponse(w, response)
		return
	}

	// Create a response object
	response := Response{
		Message: "AST successfully generated",
		AST:     parsedAST,
	}

	// Send the response
	sendResponse(w, response)
}

func sendResponse(w http.ResponseWriter, response Response) {
	// Convert response to JSON
	jsonResponse, err := json.Marshal(response)
	if err != nil {
		http.Error(w, "Error creating JSON response", http.StatusInternalServerError)
		return
	}

	// Set Content-Type header to application/json
	w.Header().Set("Content-Type", "application/json")

	// Write the JSON response
	w.Write(jsonResponse)
}