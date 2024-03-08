// ========================
// CONSTANTS
// ========================
export enum NodeType {
  FILE = "File",
  FUNC_DECL = "FuncDecl",
  IDENT = "Ident",
  BASIC_LITERAL = "BasicLiteral",
  BINARY_EXPR = "BinaryExpr",
  CALL_EXPR = "CallExpr",
  BLOCK_STMT = "BlockStmt",
  ASSIGN_STMT = "AssignStmt",
  FOR_STMT = "ForStmt",
  IF_STMT = "IfStmt",
  RETURN_STMT = "ReturnStmt",
  EXPR_STMT = "ExprStmt",
  BRANCH_STMT = "BranchStmt"
}

export enum Op {
  ASSIGN = "=",
  EQ = "==",
  NEQ = "!=",
  LT = "<",
  LTE = "<=",
  GT = ">",
  GTE = ">=",
  OR = "||",
  AND = "&&",
}

// ========================
// FILE - ROOT AST NODE
// ========================
export interface File {
  _type: NodeType.FILE
  Decls: Decl[]
  Name: Ident // package name
}

// ========================
// DECLARATIONS
// ========================

export interface Decl { }

interface Field {
  Names: Ident[] // field/method parameter names
  _type: Expr // parameter types
}

interface FieldList {
  List: Field[]
}

interface FuncType {
  Params: FieldList  // function parameters 
  Results: FieldList // return _type
}

export interface FuncDecl extends Decl {
  _type: NodeType.FUNC_DECL
  Name: Ident,
  Body: BlockStmt,
  Type: FuncType
}

// ========================
// EXPRESSIONS
// ========================

export interface Expr { }

export interface BasicLiteral extends Expr {
  _type: NodeType.BASIC_LITERAL
  Kind: string;
  Value: number | string
}

export interface BinaryExpr extends Expr {
  _type: NodeType.BINARY_EXPR
  Op: Op;
  X: Expr;
  Y: Expr;
}

export interface Ident extends Expr {
  _type: NodeType.IDENT
  Name: string;
}

export interface CallExpr extends Expr {
  _type: NodeType.CALL_EXPR,
  Args: Expr[],
  Fun: Ident,
}


// ========================
// STATEMENTS
// ========================

export interface Stmt { }

export interface AssignStmt extends Stmt {
  _type: NodeType.ASSIGN_STMT
  Lhs: Ident[],
  Rhs: Expr[]
}

export interface BlockStmt extends Stmt {
  _type: NodeType.BLOCK_STMT
  List: Stmt[]
}

export interface IfStmt extends Stmt {
  _type: NodeType.IF_STMT
  Cond: Expr,
  Body: BlockStmt,
  Else: BlockStmt | IfStmt
}

export interface ForStmt extends Stmt {
  _type: NodeType.FOR_STMT
  Body: BlockStmt,
  Cond: Expr
}

export interface ExprStmt extends Stmt { // calling a function
  _type: NodeType.EXPR_STMT
  Expr: CallExpr
}

export interface ReturnStmt extends Stmt {
  _type: NodeType.RETURN_STMT
  Results: Expr[]
}

export interface BranchStmt extends Stmt {
  _type: NodeType.BRANCH_STMT
  Token: string; // keyword token (break, continue)
}