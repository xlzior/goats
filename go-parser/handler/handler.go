package handler

import (
	"encoding/json"
	"github.com/xlzior/goats/go-parser/parser"
	"io/ioutil"
	"net/http"
)

type RequestBody struct {
	Program string `json:"program"`
}

type Response struct {
	AST   interface{} `json:"ast,omitempty"`
	Error string      `json:"error,omitempty"`
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
			Error: err.Error(),
		}
		sendResponse(w, response)
		return
	}

	// Create a response object
	response := Response{
		AST: parsedAST,
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
