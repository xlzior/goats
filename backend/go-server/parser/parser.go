package parser

import (
	"os"
	"fmt"
	"reflect"
	"strings"
	"go/parser"
	"go/token"
	"go/ast"
)

func ParseProgram(program string) (interface{}, error) {
	// Create a new token file set
	fs := token.NewFileSet()

	// Parse the program
	f, err := parser.ParseFile(fs, "", program, parser.AllErrors)

	// Transform AST to JSON representation
	json := traverse(fs, f)

	if err != nil {
		return nil, err
	}

	return json, nil
}


func traverse(fst *token.FileSet, node interface{}) map[string]interface{} {
	if node == nil {
		return nil
	}

	json := make(map[string]interface{})

	if _, ok := node.(*ast.Scope); ok {
		return nil
	}

	if _, ok := node.(*ast.Object); ok {
		return nil
	}

	val := reflect.ValueOf(node)
	if val.IsNil() {
		return nil
	}
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}
	ty := val.Type()
	json["_type"] = ty.Name()
	for i := 0; i < ty.NumField(); i++ {
		field := ty.Field(i)
		val := val.Field(i)
		if strings.HasSuffix(field.Name, "Pos") {
			continue
		}
		switch field.Type.Kind() {
		case reflect.Array, reflect.Slice:
			list := make([]interface{}, 0, val.Len())
			for i := 0; i < val.Len(); i++ {
				if item := traverse(fst, val.Index(i).Interface()); item != nil {
					list = append(list, item)
				}
			}
			json[field.Name] = list
		case reflect.Ptr:
			if child := traverse(fst, val.Interface()); child != nil {
				json[field.Name] = child
			}
		case reflect.Interface:
			if child := traverse(fst, val.Interface()); child != nil {
				json[field.Name] = child
			}
		case reflect.String:
			json[field.Name] = val.String()
		case reflect.Int:
			if field.Type.Name() == "Token" {
				json[field.Name] = token.Token(val.Int()).String()
			} else {
				json[field.Name] = val.Int()
			}
		case reflect.Bool:
			json[field.Name] = val.Bool()
		default:
			fmt.Fprintln(os.Stderr, field)
		}
	}
	if n, ok := node.(ast.Node); ok {
		start := fst.Position(n.Pos())
		end := fst.Position(n.End())
		json["Loc"] = map[string]interface{}{"Start": start, "End": end}
	}
	
	return json
}