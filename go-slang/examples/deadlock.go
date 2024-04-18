package main

func main() {
	var mu Mutex
	Lock(mu)
	Lock(mu)
}
