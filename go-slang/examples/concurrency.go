package main

// global variables
var (
	wg      WaitGroup
	mutex   Mutex
	balance = 0
)

func withdraw(n int) {
	Lock(mutex)
	balance -= n
	Unlock(mutex)
	Done(wg)
}

func deposit(n int) {
	Lock(mutex)
	balance += n
	Unlock(mutex)
	Done(wg)
}

func main() {
	i := 80000
	for i > 0 {
		Add(wg, 2)
		go deposit(1)
		go withdraw(1)
		i -= 1
	}
	Wait(wg)
	Println(balance) // balance must be 0
}
