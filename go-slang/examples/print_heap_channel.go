package main

func send(channel chan int, n int) {
	channel <- n
}

func main() {
	buffered_channel := make(chan int, 10)

	go send(buffered_channel, 1)
	go send(buffered_channel, 2)
	go send(buffered_channel, 3)

	Sleep(10)

	PrintHeap()
}
