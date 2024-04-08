# Go Parser

This project contains a simple Go server with an endpoint for parsing Go programs and returning the Abstract Syntax Tree (AST) as JSON.

## Getting Started

### Installation

Make sure you have Go installed on your machine. You can download and install it from the official [Go website](https://golang.org/dl/). The version used in this project is `1.20`.

Install dependencies by running `go mod download`.

## Usage

Start the Go server by running `go run main.go`.

Open Postman and test the endpoint at [http://localhost:8080](http://localhost:8080)


### Endpoint

- `/parse`: POST endpoint for parsing Go programs and returning the AST as JSON.

### Request Format

Send a POST request to `/parse` with a JSON payload containing the Go program to be parsed. Example:

```json
{
  "program": "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tfmt.Println(\"Hello, World!\")\n}"
}

```

### Response Format

The server will respond with a JSON object containing the parsed AST or an error message. Example:

```json
{
  "ast": {
    "Type": "Package",
    ...
  }
}
```