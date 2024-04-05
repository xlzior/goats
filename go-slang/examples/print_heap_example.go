package main

func main() {
	a := 1
	b := "hello world"
	c := false

	var d Mutex
	var e WaitGroup

	Lock(d)
	Add(e, 8)

	Print_Heap()
}
