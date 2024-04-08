package main

var (
	wg WaitGroup
	mutex Mutex
	balance = 0
)

func withdraw(amt int) {
	Lock(mutex)
	i := 0
	for i < amt {
		i++
		balance--
	}
	Unlock(mutex)
	Done(wg)
}

func deposit(amt int) {
	Lock(mutex)
	i := 0
	for i < amt {
		i++
		balance++
	}
	Unlock(mutex)
	Done(wg)
}

func main() {
	i := 300
	for i > 0 {
		Add(wg, 2)
		go deposit(100)
		go withdraw(100)
		i -= 1
	}
	Wait(wg)
	return balance
}