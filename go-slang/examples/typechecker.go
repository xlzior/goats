package main 

// func invalid_arithmtic_operator() {
// 	a := true + "hello"
// }

// func invalid_comparison_operator() {
// 	a := 1 > "world" 
// }

// func invalid_logical_operator() {
// 	a := true || 123
// }

// func invalid_var_decl_with_type() {
// 	var x int = "123"
// }

// func invalid_var_reassignment() {
// 	var x int = 123
// 	x = true
// }

// func invalid_multiple_assignment() {
// 	a, b, c := 1, 2
// 	a := 1, 2, 3
// }

// func invalid_return_type_in_funcdecl_ifelse() int {
// 	x := 10
// 	if x > 0 {
// 		return 1
// 	} else {
// 		return "hello"
// 	}
// }

// func missing_return_in_funcdecl_ifelse() int {
// 	x := 10
// 	if x > 0 {
// 		return 100
// 	} 
// }

// func missing_return_in_funcdecl_forloop() int {
// 	x := 10
// 	for x > 0 {
// 		x -= 1
// 		Println(x)
// 		return 123
// 	}
// }

// func incorrect_number_return_in_funcdecl() int {
// 	x := 10
// 	if x > 0 {
// 		return 1,2
// 	} else {
// 		return 3,4,5
// 	}
// }

func add(a int, b int) int {
	return a + b
}

func add_one(a int) int {
	return a + 1
}

func applyFunc(x int, y int, f func(int, int) int) int {
	x := f(x, y)
	return x
}

func main() {
	// res := add(1) // not enough arguments
	// res := add(1, 2, 3) // too many arguments
	// res := add(1, "hello") // invalid arg type
	// hof := applyFunc(1, 2, add_one)
}