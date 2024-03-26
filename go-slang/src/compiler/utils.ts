import {
  Expr,
  Token,
  Ident,
  CallExpr,
  NodeType,
  BasicLit,
  AssignStmt,
  BinaryExpr,
} from "../types/ast";

export function stripQuotes(str: string) {
  return str.replace(/^"|"$/g, "");
}

export const compoundAssignmentToBinaryOperator = new Map([
  [Token.ADD_ASSIGN, Token.ADD],
  [Token.SUB_ASSIGN, Token.SUB],
  [Token.MUL_ASSIGN, Token.MUL],
  [Token.QUO_ASSIGN, Token.QUO],
  [Token.REM_ASSIGN, Token.REM],
  [Token.AND_ASSIGN, Token.AND],
  [Token.OR_ASSIGN, Token.OR],
  [Token.XOR_ASSIGN, Token.XOR],
  [Token.SHL_ASSIGN, Token.SHL],
  [Token.SHR_ASSIGN, Token.SHR],
  [Token.AND_NOT_ASSIGN, Token.AND_NOT],
]);

export const typeToDefaultValues = new Map<string, Expr>([
  ["int", make_basic_lit("INT", "0")],
  ["string", make_basic_lit("STRING", "")],
  ["bool", make_ident("false")],
]);

export function noNewVariables(
  identifiers: Ident[],
  curr_env_frame: Array<string>,
) {
  return identifiers.every((ident) => curr_env_frame.includes(ident.Name));
}

export const MAIN_CALL: CallExpr = {
  _type: NodeType.CALL_EXPR,
  Args: [],
  Fun: {
    _type: NodeType.IDENT,
    Name: "main",
  },
};

// ===========================================
// HELPER METHODS TO RECONSTRUCT AST NODE
// ===========================================

export function make_basic_lit(type: string, value: string): BasicLit {
  return {
    _type: NodeType.BASIC_LIT,
    Kind: type,
    Value: value,
  };
}

export function make_ident(value: string): Ident {
  return {
    _type: NodeType.IDENT,
    Name: value,
  };
}

export function make_binary_expr(Op: Token, X: Expr, Y: Expr): BinaryExpr {
  return {
    _type: NodeType.BINARY_EXPR,
    Op,
    X,
    Y,
  };
}

export function make_assign_stmt(
  lhs: Ident[],
  rhs: Expr[],
  tok: Token,
): AssignStmt {
  return {
    _type: NodeType.ASSIGN_STMT,
    Lhs: lhs,
    Rhs: rhs,
    Tok: tok,
  };
}
