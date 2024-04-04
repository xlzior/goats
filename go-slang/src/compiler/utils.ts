import * as AST from "../types/ast";
import { DataType } from "../types/data_type";

export const compoundAssignmentToBinaryOperator = new Map([
  [AST.Token.ADD_ASSIGN, AST.Token.ADD],
  [AST.Token.SUB_ASSIGN, AST.Token.SUB],
  [AST.Token.MUL_ASSIGN, AST.Token.MUL],
  [AST.Token.QUO_ASSIGN, AST.Token.QUO],
  [AST.Token.REM_ASSIGN, AST.Token.REM],
  [AST.Token.AND_ASSIGN, AST.Token.AND],
  [AST.Token.OR_ASSIGN, AST.Token.OR],
  [AST.Token.XOR_ASSIGN, AST.Token.XOR],
  [AST.Token.SHL_ASSIGN, AST.Token.SHL],
  [AST.Token.SHR_ASSIGN, AST.Token.SHR],
  [AST.Token.AND_NOT_ASSIGN, AST.Token.AND_NOT],
]);

export const typeToDefaultValue = new Map<string, AST.Expr>([
  [DataType.INT, make_basic_lit(AST.Token.INT, "0")],
  [DataType.STRING, make_basic_lit(AST.Token.STRING, "")],
  [DataType.BOOL, make_ident("false")],
  [DataType.MUTEX, make_ident(DataType.MUTEX)],
  [DataType.WAITGROUP, make_ident(DataType.WAITGROUP)],
]);

export function noNewVariables(
  identifiers: AST.Ident[],
  curr_env_frame: Array<string>,
) {
  return identifiers.every((ident) => curr_env_frame.includes(ident.Name));
}

export const MAIN_CALL: AST.CallExpr = make_call_expr([], make_ident("main"));

// ===========================================
// HELPER METHODS TO RECONSTRUCT AST NODE
// ===========================================

export function make_basic_lit(type: AST.Token, value: string): AST.BasicLit {
  return {
    _type: AST.NodeType.BASIC_LIT,
    Kind: type,
    Value: value,
  };
}

export function make_ident(value: string): AST.Ident {
  return {
    _type: AST.NodeType.IDENT,
    Name: value,
  };
}

export function make_binary_expr(
  Op: AST.Token,
  X: AST.Expr,
  Y: AST.Expr,
): AST.BinaryExpr {
  return {
    _type: AST.NodeType.BINARY_EXPR,
    Op,
    X,
    Y,
  };
}

export function make_assign_stmt(
  lhs: AST.Ident[],
  rhs: AST.Expr[],
  tok: AST.Token,
): AST.AssignStmt {
  return {
    _type: AST.NodeType.ASSIGN_STMT,
    Lhs: lhs,
    Rhs: rhs,
    Tok: tok,
  };
}

export function make_call_expr(Args: AST.Expr[], Fun: AST.Ident): AST.CallExpr {
  return {
    _type: AST.NodeType.CALL_EXPR,
    Args,
    Fun,
  };
}
