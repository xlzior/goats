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
  CHAN_TYPE = "ChanType",
  SEND_STMT = "SendStmt",
  FUNC_TYPE = "FuncType",
}

export enum Token {
  // Special tokens
  ILLEGAL,
  EOF,
  COMMENT,

  // Identifiers and basic type literals
  // (these tokens stand for classes of literals)
  IDENT, // main
  FLOAT, // 123.45
  IMAG, // 123.45i
  CHAR, // 'a'

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

  INT = "INT", // 12345
  STRING = "STRING", // "abc"

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

export type Node = Spec | Decl | Expr | Stmt;

// ========================
// FILE - ROOT AST NODE
// ========================

export type File = {
  _type: "File";
  Decls: Decl[];
  Name: Ident; // package name
};

// ========================
// TYPES
// ========================

export type ChanType = {
  _type: NodeType.CHAN_TYPE;
  Value: Ident;
};

export type FuncType = {
  _type: NodeType.FUNC_TYPE;
  Params: FieldList; // function parameters
  Results: FieldList; // return type
};

type FieldList = {
  List: Field[];
};

type Field = {
  Names: Ident[]; // field/method parameter names
  Type: Expr; // parameter types
};

// ========================
// DECLARATIONS
// ========================

export type Decl = FuncDecl | GenDecl;

export type FuncDecl = {
  _type: NodeType.FUNC_DECL;
  Name: Ident;
  Body: BlockStmt;
  Type: FuncType;
};

export type GenDecl = {
  _type: NodeType.GEN_DECL;
  Specs: Spec[];
  Tok: Token;
};

type Spec = ValueSpec;

export type ValueSpec = {
  _type: NodeType.VALUE_SPEC;
  Names: Ident[];
  Values: Expr[];
  Type: Ident;
};

// ========================
// EXPRESSIONS
// ========================

export type Expr =
  | BasicLit
  | BinaryExpr
  | UnaryExpr
  | ParenExpr
  | Ident
  | CallExpr
  | ChanType
  | FuncType;

export type BasicLit = {
  _type: NodeType.BASIC_LIT;
  Kind: Token;
  Value: number | string;
};

export type BinaryExpr = {
  _type: NodeType.BINARY_EXPR;
  Op: Token;
  X: Expr;
  Y: Expr;
};

export type UnaryExpr = {
  _type: NodeType.UNARY_EXPR;
  Op: Token.SUB | Token.NOT | Token.ARROW;
  X: Expr;
};

export type ParenExpr = {
  _type: NodeType.PAREN_EXPR;
  X: Expr;
};

export type Ident = {
  _type: NodeType.IDENT;
  Name: string;
};

export type CallExpr = {
  _type: NodeType.CALL_EXPR;
  Args: Expr[];
  Fun: Ident;
};

// ========================
// STATEMENTS
// ========================

export type Stmt =
  | AssignStmt
  | BlockStmt
  | IfStmt
  | ForStmt
  | ExprStmt
  | ReturnStmt
  | BranchStmt
  | IncDecStmt
  | SendStmt
  | GoStmt
  | DeclStmt;

export type AssignStmt = {
  _type: NodeType.ASSIGN_STMT;
  Lhs: Ident[];
  Rhs: Expr[];
  Tok: Token;
};

export type BlockStmt = {
  _type: NodeType.BLOCK_STMT;
  List: (Stmt | Decl)[];
};

export type IfStmt = {
  _type: NodeType.IF_STMT;
  Cond: Expr;
  Body: BlockStmt;
  Else?: BlockStmt | IfStmt; // if there is no else if or else, IfStmt Node does not have Else property
};

export type ForStmt = {
  _type: NodeType.FOR_STMT;
  Body: BlockStmt;
  Cond: Expr;
};

export type ExprStmt = {
  _type: NodeType.EXPR_STMT;
  X: Expr;
};

export type ReturnStmt = {
  _type: NodeType.RETURN_STMT;
  Results: Expr[];
};

export type BranchStmt = {
  _type: NodeType.BRANCH_STMT;
  Tok: Token; // keyword token (break, continue)
};

export type IncDecStmt = {
  _type: NodeType.INC_DEC_STMT;
  Tok: Token.INC | Token.DEC;
  X: Ident;
};

export type GoStmt = {
  _type: NodeType.GO_STMT;
  Call: CallExpr;
};

export type DeclStmt = {
  _type: NodeType.DECL_STMT;
  Decl: Decl;
};

export type SendStmt = {
  _type: NodeType.SEND_STMT;
  Chan: Expr;
  Value: Expr;
};
