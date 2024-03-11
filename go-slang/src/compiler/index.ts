import {
  File,
  BasicLit,
  BinaryExpr,
  BlockStmt,
  ExprStmt,
  FuncDecl,
  ReturnStmt,
  Node,
  Stmt,
  NodeType,
  AssignStmt,
  Expr,
  Ident,
  CallExpr,
} from "../types";

function scan(statement: Stmt): string[] {
  switch (statement._type) {
    case NodeType.ASSIGN_STMT:
      return (statement as AssignStmt).Lhs.map((e) => e.Name);
    default:
      return [];
  }
}

export class GolangCompiler {
  private wc: number;
  private instrs: Array<any>;
  private compile_ast: any;

  constructor() {
    this.wc = 0;
    this.instrs = [];
    this.compile_ast = {
      BasicLit: (astNode: BasicLit) => {
        this.instrs[this.wc++] = {
          tag: "LDC",
          val: astNode.Kind === "INT" ? Number(astNode.Value) : astNode.Value,
        };
      },
      BinaryExpr: (astNode: BinaryExpr) => {
        this.compile(astNode.X);
        this.compile(astNode.Y);
        this.instrs[this.wc++] = { tag: "BINOP", sym: astNode.Op };
      },
      FuncDecl: (astNode: FuncDecl) => {
        const params = astNode.Type.Params.List.flatMap((e) =>
          e.Names.map((name) => name.Name),
        );
        this.instrs[this.wc++] = {
          tag: "LDF",
          params: params,
          addr: this.wc + 1,
        };
        const goto_instruction = { tag: "GOTO", addr: -1 };
        this.instrs[this.wc++] = goto_instruction;
        this.compile(astNode.Body);
        this.instrs[this.wc++] = { tag: "LDC", val: undefined };
        this.instrs[this.wc++] = { tag: "RESET" };
        goto_instruction.addr = this.wc;
        this.instrs[this.wc++] = { tag: "ASSIGN", sym: astNode.Name.Name };
      },
      CallExpr: (astNode: CallExpr) => {
        this.compile(astNode.Fun);
        astNode.Args.forEach((arg) => this.compile(arg));
        this.instrs[this.wc++] = { tag: "CALL", arity: astNode.Args.length };
      },
      BlockStmt: (astNode: BlockStmt) => {
        const locals = astNode.List.flatMap(scan);
        this.instrs[this.wc++] = { tag: "ENTER_SCOPE", syms: locals };
        astNode.List.forEach((stmt, i) => {
          this.compile(stmt);
          if (i < astNode.List.length - 1) {
            this.instrs[this.wc++] = { tag: "POP" };
          }
        });
        this.instrs[this.wc++] = { tag: "EXIT_SCOPE" };
      },
      AssignStmt: (astNode: AssignStmt) => {
        const assignments: [Ident, Expr][] = astNode.Lhs.map((sym, i) => [
          sym,
          astNode.Rhs[i],
        ]);
        assignments.forEach(([ident, expr]) => {
          this.compile(expr);
          this.instrs[this.wc++] = { tag: "ASSIGN", sym: ident.Name };
        });
      },
      Ident: (astNode: Ident) => {
        const name = astNode.Name
        let instr;
        // Go treats boolean as Ident. Adds a LDC instruction
        if (name === "true" || name === "false") {
          instr = {
            tag: "LDC",
            val: name === "true" ? true : false
          };
        } else {
          instr = {
            tag: "LD",
            sym: name
          };
        }
        this.instrs[this.wc++] = instr
      },
      ReturnStmt: (astNode: ReturnStmt) => {
        astNode.Results.forEach((result) => {
          this.compile(result);
        });
        this.instrs[this.wc++] = { tag: "RESET" };
      },
      ExprStmt: (astNode: ExprStmt) => {
        this.compile(astNode.X);
      },
    };
  }

  private compile(astNode: Node) {
    if (this.compile_ast[astNode._type] !== undefined) {
      this.compile_ast[astNode._type](astNode);
    } else {
      console.error(astNode._type, "not implemented");
      console.error(astNode);
    }
  }

  compile_program(rootAstNode: File) {
    const locals = rootAstNode.Decls.map((node) => node.Name.Name);
    this.instrs[this.wc++] = { tag: "ENTER_SCOPE", syms: locals };
    rootAstNode.Decls.forEach((node) => this.compile(node));
    this.instrs[this.wc++] = { tag: "LD", sym: "main" };
    this.instrs[this.wc++] = { tag: "CALL", arity: 0 };
    this.instrs[this.wc++] = { tag: "EXIT_SCOPE" };
    this.instrs[this.wc] = { tag: "DONE" };
    return this.instrs;
  }
}
