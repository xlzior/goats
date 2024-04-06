package main

func add(a int, b int) int {
  return a + b
}

func proxy() func(int, int) int {
	x := "all i do is to return another function"
	return add
}

func applyFunc(x, y int, f func(int, int) int) int {
  x := f(x, y)
  return x
}

func main() {
  res1 := applyFunc(3, 5, add) // receiving function as arg
	fn := proxy() // returning function
  res2 := fn(10, 12)
	Println(res1)
	Println(res2)
}