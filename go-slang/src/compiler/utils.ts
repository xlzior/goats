import { Token, Ident, CallExpr, NodeType } from "../types/ast";

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
