import {
  File,
  BasicLit,
  BinaryExpr,
  BlockStmt,
  ExprStmt,
  FuncDecl,
} from "../types";

export class GolangCompiler {
  private wc: number;
  private instrs: Array<any>;
  private compile_ast: any;

  constructor() {
    this.wc = 0;
    this.instrs = [];
    this.compile_ast = {
      BasicLit: (astNode: BasicLit) => {
        this.instrs[this.wc++] = { tag: "LDC", val: Number(astNode.Value) };
      },
      BinaryExpr: (astNode: BinaryExpr) => {
        this.compile(astNode.X);
        this.compile(astNode.Y);
        this.instrs[this.wc++] = { tag: "BINOP", sym: astNode.Op };
      },
      // TODO: to compile other properties of FuncDecl in a future PR that handles function constructs
      FuncDecl: (astNode: FuncDecl) => {
        this.compile(astNode.Body);
      }, 
      // TODO: to handle block scope of variables in a future PR that handles block construct
      BlockStmt: (astNode: BlockStmt) => {
        const stmts = astNode.List;
        stmts.forEach(stmt => this.compile(stmt))
      },
      ExprStmt: (astNode: ExprStmt) => {
        this.compile(astNode.X);
      },
    };
  }

  private compile(astNode: any) {
    // Currently ignores AST nodes that are unimplemented
    if (this.compile_ast[astNode._type] !== undefined) {
      this.compile_ast[astNode._type](astNode);
    }
    this.instrs[this.wc] = { tag: "DONE" };
    return this.instrs;
  }

  // Currently, it assumes there is only one function, which is main()
  // TODO: We need check which function is main and then return the PC that starts from main? this can be discussed
  compile_program(rootAstNode: File) {
    rootAstNode.Decls.forEach(node => this.compile(node))
    return this.instrs;
  }
}
