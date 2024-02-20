import { ErrorNode } from "antlr4ts/tree/ErrorNode";
import { ParseTree } from "antlr4ts/tree/ParseTree";
import { RuleNode } from "antlr4ts/tree/RuleNode";
import { TerminalNode } from "antlr4ts/tree/TerminalNode";
import { GoParserVisitor } from "./out/GoParserVisitor";

export class MyVisitor implements GoParserVisitor<any> {
  visit(tree: ParseTree) {
    console.log(tree);
    throw new Error("Method not implemented.");
  }
  visitChildren(node: RuleNode) {
    throw new Error("Method not implemented.");
  }
  visitTerminal(node: TerminalNode) {
    throw new Error("Method not implemented.");
  }
  visitErrorNode(node: ErrorNode) {
    throw new Error("Method not implemented.");
  }
}
