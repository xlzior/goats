package main

func add(a int, b int) int {
  return a + b
}

func applyFunc(f func(int, int) int) int {
  x := f(3, 5)
  return x
}

func main() {
  result := applyFunc(add)
  Println(result)
}