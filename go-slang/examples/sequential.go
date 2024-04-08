package main

// function declaration
func fact(n int) int {
	// conditional
	if n == 1 {
		return 1
	}
	return n * fact(n - 1)
}

func main() {
	
	// short variable declaration
	str := "Welcome to GOaTs"
	Println(str)

	// multiple assignments
	a, b, c := 10, 20, 30
	Println(a + b + c) // 60

	// binary operators
	expr := 1 + 3 - 10 / 5 * 73

	// variable declaration
	var x int = 10

	// for loop
	for x > 0 {
		Println(x)
		x -= 1
	}

	// block scoping
	d := 88
	Println(d) // 88
	{
		d := 999
		Println(d) // 999
	}

	// function application
	fact_res := fact(4) // 24
	Println(fact_res)

	return 100
}