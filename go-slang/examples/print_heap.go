package main

func main() {
	n := 1
	s := "hello world"
	b := false

	channel := make(chan int)
	buffered_channel := make(chan string, 10)
	var mutex Mutex
	var wait_group WaitGroup

	Lock(mutex)
	Add(wait_group, 8)

	PrintHeap()
}
