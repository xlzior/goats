package main

func send(messages chan int) {
	messages <- 1
	Println("1 sent")
	messages <- 2
	Println("2 sent")
	messages <- 3
	Println("3 sent")
}

func main() {
	messages := make(chan int)
	go send(messages)
	msg1 := <-messages
	Println("1 received")
	msg2 := <-messages
	Println("2 received")
	msg3 := <-messages
	Println("3 received")
	return msg1*100 + msg2*10 + msg3
}
