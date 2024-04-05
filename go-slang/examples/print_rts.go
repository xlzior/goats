package main

func factorial(n int) int {
	if n == 1 {
		x := "now inside the if statement"
		{
			PrintRuntimeStack()
		}
		return 1
	}
	return n * factorial(n-1)
}

func main() {
	return factorial(5)
}
