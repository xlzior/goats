# GOaTS: GOlang interpreter in TypeScript

GOaTS is a small Golang interpreter developed using TypeScript, offering a subset of Golang's features. 
It includes a web-based playground equipped with a code editor for execution of code.

## Quick Start

### Installation

There are 2 ways to set up GOaTS:

- Docker

If you do not have Docker Desktop, please download it. 
At the root project directory, run `docker compose up` to start the container.
To stop, press `Ctrl+C`.

- Manual

Please follow the instructions outlined in the README 
within each directory in the following order:
  1. go-parser
  2. go-slang
  3. js-slang
  4. frontend


### Usage
Once the setup is complete, navigate to http://localhost:8000 to utilize the playground.

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
Debugging is made easier with our memory visualization feature, allowing users to inspect the heap memory. 
Access this feature via the built-in functions `PrintHeap`, `PrintEnvironment` or `PrintRuntimeStack`.