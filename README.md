# GOaTS: GOlang interpreter in TypeScript

GOaTS is a small Golang interpreter developed using TypeScript, offering a subset of Golang's features. It includes a web-based playground equipped with a code editor for execution of code.

## Quick Start

### Installation

To set up GOaTS, please follow the instructions outlined in the README 
within each directory in the following order:

1. go-slang
2. js-slang
3. frontend

### Usage
Once the frontend setup is complete, navigate to http://localhost:8000 to utilize the playground.

## Features

### Sequential constructs
- Expressions
- Conditional
- For loops
- Block scoping
- Function declarations
- Variable declarations

### Concurrent constructs
- Goroutines
- Mutex
- WaitGroup
- Channels

### Automatic Memory Management
We've included a garbage collector to efficiently manage dynamically allocated memory.

### Type Checking
We've incorporated a robust type-checker to ensure the type safety of all programs.

### Memory Visualisation
Debugging is made easier with our memory visualization feature, allowing users to inspect the heap memory. Access this feature via the built-in functions `PrintHeap` or `PrintRuntimeStack`.