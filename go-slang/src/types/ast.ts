export type ParserResultSuccess = {
  ast: File;
};

type ParserResultError = {
  error: string;
};

export type ParserResult = ParserResultSuccess | ParserResultError;

// ========================
// CONSTANTS
// ========================
export enum NodeType {
  FILE = "File",
  FUNC_DECL = "FuncDecl",
  GEN_DECL = "GenDecl",
  IDENT = "Ident",
  BASIC_LIT = "BasicLit",
  BINARY_EXPR = "BinaryExpr",
  UNARY_EXPR = "UnaryExpr",
  CALL_EXPR = "CallExpr",
  PAREN_EXPR = "ParenExpr",
  BLOCK_STMT = "BlockStmt",
  ASSIGN_STMT = "AssignStmt",
  FOR_STMT = "ForStmt",
  IF_STMT = "IfStmt",
  RETURN_STMT = "ReturnStmt",
  EXPR_STMT = "ExprStmt",
  BRANCH_STMT = "BranchStmt",
  INC_DEC_STMT = "IncDecStmt",
  GO_STMT = "GoStmt",
  DECL_STMT = "DeclStmt",
  VALUE_SPEC = "ValueSpec",
}

export enum Token {
  // Special tokens
  ILLEGAL,
  EOF,
  COMMENT,

  // Identifiers and basic type literals
  // (these tokens stand for classes of literals)
  IDENT, // main
  INT, // 12345
  FLOAT, // 123.45
  IMAG, // 123.45i
  CHAR, // 'a'
  STRING, // "abc"

  // Keywords
  BREAK,
  CASE,
  CHAN,
  CONST,
  CONTINUE,

  DEFAULT,
  DEFER,
  ELSE,
  FALLTHROUGH,
  FOR,

  FUNC,
  GO,
  GOTO,
  IF,
  IMPORT,

  INTERFACE,
  MAP,
  PACKAGE,
  RANGE,
  RETURN,

  SELECT,
  STRUCT,
  SWITCH,
  TYPE,

  // additional tokens, handled in an ad-hoc manner
  TILDE,

  VAR = "var",

  // Operators and delimiters
  ADD = "+",
  SUB = "-",
  MUL = "*",
  QUO = "/",
  REM = "%",

  AND = "&",
  OR = "|",
  XOR = "^",
  SHL = "<<",
  SHR = ">>",
  AND_NOT = "&^",

  ADD_ASSIGN = "+=",
  SUB_ASSIGN = "-=",
  MUL_ASSIGN = "*=",
  QUO_ASSIGN = "/=",
  REM_ASSIGN = "%=",

  AND_ASSIGN = "&=",
  OR_ASSIGN = "|=",
  XOR_ASSIGN = "^=",
  SHL_ASSIGN = "<<=",
  SHR_ASSIGN = ">>=",
  AND_NOT_ASSIGN = "&^=",

  LAND = "&&",
  LOR = "||",
  ARROW = "<-",
  INC = "++",
  DEC = "--",

  EQL = "==",
  LSS = "<",
  GTR = ">",
  ASSIGN = "=",
  NOT = "!",

  NEQ = "!=",
  LEQ = "<=",
  GEQ = ">=",
  DEFINE = ":=",
  ELLIPSIS = "...",

  LPAREN = "(",
  LBRACK = "[",
  LBRACE = "{",
  COMMA = ",",
  PERIOD = ".",

  RPAREN = ")",
  RBRACK = "]",
  RBRACE = "}",
  SEMICOLON = ";",
  COLON = ":",
}

// ========================
// FILE - ROOT AST NODE
// ========================
export interface File {
  _type: NodeType.FILE;
  Decls: Decl[];
  Name: Ident; // package name
}

export interface Node {
  _type: NodeType;
}

// ========================
// DECLARATIONS
// ========================

export interface Decl extends Node {
  Name: Ident;
}

export interface Spec extends Node {}

interface Field {
  Names: Ident[]; // field/method parameter names
  _type: Expr; // parameter types
}

interface FieldList {
  List: Field[];
}

interface FuncType {
  Params: FieldList; // function parameters
  Results: FieldList; // return _type
}

export interface ValueSpec extends Spec {
  _type: NodeType.VALUE_SPEC;
  Names: Ident[];
  Values: Expr[];
  Type: Ident;
}

export interface FuncDecl extends Decl {
  _type: NodeType.FUNC_DECL;
  Name: Ident;
  Body: BlockStmt;
  Type: FuncType;
}

export interface GenDecl extends Decl {
  _type: NodeType.GEN_DECL;
  Specs: Spec[];
  Tok: Token;
}

// ========================
// EXPRESSIONS
// ========================

export interface Expr extends Node {}

export interface BasicLit extends Expr {
  _type: NodeType.BASIC_LIT;
  Kind: string;
  Value: number | string;
}

export interface BinaryExpr extends Expr {
  _type: NodeType.BINARY_EXPR;
  Op: Token;
  X: Expr;
  Y: Expr;
}

export interface UnaryExpr extends Expr {
  _type: NodeType.UNARY_EXPR;
  Op: Token.SUB | Token.NOT;
  X: Expr;
}

export interface ParenExpr extends Expr {
  _type: NodeType.PAREN_EXPR;
  X: Expr;
}

export interface Ident extends Expr {
  _type: NodeType.IDENT;
  Name: string;
}

export interface CallExpr extends Expr {
  _type: NodeType.CALL_EXPR;
  Args: Expr[];
  Fun: Ident;
}

// ========================
// STATEMENTS
// ========================

export interface Stmt extends Node {}

export interface AssignStmt extends Stmt {
  _type: NodeType.ASSIGN_STMT;
  Lhs: Ident[];
  Rhs: Expr[];
  Tok: Token;
}

export interface BlockStmt extends Stmt {
  _type: NodeType.BLOCK_STMT;
  List: Stmt[];
}

export interface IfStmt extends Stmt {
  _type: NodeType.IF_STMT;
  Cond: Expr;
  Body: BlockStmt;
  Else?: BlockStmt | IfStmt; // if there is no else if or else, IfStmt Node does not have Else property
}

export interface ForStmt extends Stmt {
  _type: NodeType.FOR_STMT;
  Body: BlockStmt;
  Cond: Expr;
}

export interface ExprStmt extends Stmt {
  _type: NodeType.EXPR_STMT;
  X: Expr;
}

export interface ReturnStmt extends Stmt {
  _type: NodeType.RETURN_STMT;
  Results: Expr[];
}

export interface BranchStmt extends Stmt {
  _type: NodeType.BRANCH_STMT;
  Token: string; // keyword token (break, continue)
}

export interface IncDecStmt extends Stmt {
  _type: NodeType.INC_DEC_STMT;
  Tok: Token.INC | Token.DEC;
  X: Ident;
}

export interface GoStmt extends Stmt {
  _type: NodeType.GO_STMT;
  Call: CallExpr;
}

export interface DeclStmt extends Stmt {
  _type: NodeType.DECL_STMT;
  Decl: Decl;
}