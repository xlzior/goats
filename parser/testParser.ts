import { CharStreams, CommonTokenStream } from "antlr4ts";
import { GoLexer } from "./out/GoLexer";
import { GoParser } from "./out/GoParser";
import { MyVisitor } from "./MyVisitor";

// Create the lexer and parser
let inputStream = CharStreams.fromString(`
// You can edit this code!
// Click here and start typing.
package main

import "fmt"

func main() {
 var x int = 1
 fmt.Println(x)
}
`);
let lexer = new GoLexer(inputStream);
let tokenStream = new CommonTokenStream(lexer);
let parser = new GoParser(tokenStream);

try {
  // Use the generated parser to start parsing
  const tree = parser.sourceFile();

  // If parsing is successful, print the resulting tree
  console.log(tree.toStringTree(parser.ruleNames));

  // Attempts at using a Visitor
  const visitor = new MyVisitor();
  const result = visitor.visit(tree);
  console.log(result);
} catch (error) {
  // If there's a parsing error, catch and print the error
  console.error("Parsing failed:", error);
}
