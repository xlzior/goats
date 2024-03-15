import {
  File,
  BasicLit,
  BinaryExpr,
  BlockStmt,
  ExprStmt,
  FuncDecl,
  ReturnStmt,
  Node,
  NodeType,
  AssignStmt,
  Expr,
  Ident,
  CallExpr,
  UnaryExpr,
  ParenExpr,
  IfStmt,
  Token,
  ForStmt,
  IncDecStmt,
} from "../types/ast";

import { GOTO, JOF, Instruction } from "../types/vm_instructions";

function stripQuotes(str: string) {
  return str.replace(/^"|"$/g, "");
}

function peek<T>(stack: Array<T>): T {
  return stack[stack.length - 1];
}

const compoundAssignmentToBinaryOperator = new Map([
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

function noNewVariables(identifiers: Ident[], curr_env_frame: Array<string>) {
  return identifiers.every((ident) => curr_env_frame.includes(ident.Name));
}

const main_call: CallExpr = {
  _type: NodeType.CALL_EXPR,
  Args: [],
  Fun: {
    _type: NodeType.IDENT,
    Name: "main",
  },
};

export class GolangCompiler {
  private wc: number;
  private instrs: Array<Instruction>;
  private compile_ast: any;
  private compile_env: Array<Array<string>>; // stack of arrays

  constructor() {
    this.wc = 0;
    this.instrs = [];
    this.compile_env = [];
    this.compile_ast = {
      BasicLit: (astNode: BasicLit) => {
        this.instrs[this.wc++] = {
          _type: "LDC",
          val:
            astNode.Kind === "STRING"
              ? stripQuotes(astNode.Value as string)
              : Number(astNode.Value), // can handle integers and floating point values
        };
      },
      BinaryExpr: (astNode: BinaryExpr) => {
        if (astNode.Op === Token.LAND) {
          // X && Y is "if X then Y else false"
          const falseExpr: Ident = { _type: NodeType.IDENT, Name: "false" };
          return this.compile_conditional(astNode.X, astNode.Y, falseExpr);
        }
        if (astNode.Op === Token.LOR) {
          // X || Y is "if X then true else Y"
          const trueExpr: Ident = { _type: NodeType.IDENT, Name: "true" };
          return this.compile_conditional(astNode.X, trueExpr, astNode.Y);
        }
        this.compile(astNode.X);
        this.compile(astNode.Y);
        this.instrs[this.wc++] = { _type: "BINOP", sym: astNode.Op };
      },
      UnaryExpr: (astNode: UnaryExpr) => {
        this.compile(astNode.X);
        this.instrs[this.wc++] = { _type: "UNOP", sym: astNode.Op };
      },
      ParenExpr: (astNode: ParenExpr) => {
        this.compile(astNode.X);
      },
      FuncDecl: (astNode: FuncDecl) => {
        const params = astNode.Type.Params.List.flatMap((e) =>
          e.Names.map((name) => name.Name),
        );
        this.instrs[this.wc++] = {
          _type: "LDF",
          params: params,
          addr: this.wc + 1,
        };
        const goto_instruction: GOTO = { _type: "GOTO", addr: -1 };
        this.instrs[this.wc++] = goto_instruction;
        this.compile(astNode.Body);
        this.instrs[this.wc++] = { _type: "LDC", val: undefined };
        this.instrs[this.wc++] = { _type: "RESET" };
        goto_instruction.addr = this.wc;

        const function_name = astNode.Name.Name;
        const current_frame = peek(this.compile_env);
        if (current_frame.includes(function_name)) {
          throw new Error(`${function_name} redeclared in this block`);
        }
        current_frame.push(function_name);
        this.instrs[this.wc++] = { _type: "DEFINE", sym: function_name };
        this.instrs[this.wc++] = { _type: "ASSIGN", sym: function_name };
      },
      CallExpr: (astNode: CallExpr) => {
        this.compile(astNode.Fun);
        astNode.Args.forEach((arg) => this.compile(arg));
        this.instrs[this.wc++] = { _type: "CALL", arity: astNode.Args.length };
      },
      BlockStmt: (astNode: BlockStmt) => {
        this.compile_env.push([]);
        // empty block
        if (astNode.List.length === 0) {
          this.instrs[this.wc++] = { _type: "LDC", val: undefined };
          return;
        }

        this.instrs[this.wc++] = { _type: "ENTER_SCOPE" };

        astNode.List.forEach((stmt, i) => {
          this.compile(stmt);
          if (i < astNode.List.length - 1) {
            this.instrs[this.wc++] = { _type: "POP" };
          }
        });

        this.instrs[this.wc++] = { _type: "EXIT_SCOPE" };
        this.compile_env.pop();
      },
      AssignStmt: (astNode: AssignStmt) => {
        const current_frame = peek(this.compile_env);
        if (
          astNode.Tok === Token.DEFINE &&
          noNewVariables(astNode.Lhs, current_frame)
        ) {
          throw new Error("no new variables on left side of :=");
        }

        astNode.Rhs.forEach((expr, i) => {
          if (astNode.Tok === Token.DEFINE || astNode.Tok === Token.ASSIGN) {
            // simple assignment
            this.compile(expr);
          } else {
            // compound assignment: +=, -=, *=, /= etc
            const Op = compoundAssignmentToBinaryOperator.get(astNode.Tok);
            if (Op === undefined) {
              throw new Error(`operator not implemented: ${astNode.Tok}`);
            }
            const desugared: BinaryExpr = {
              _type: NodeType.BINARY_EXPR,
              Op,
              X: astNode.Lhs[i],
              Y: expr,
            };
            this.compile(desugared);
          }
        });

        astNode.Lhs.reverse().forEach((ident) => {
          if (
            astNode.Tok === Token.DEFINE &&
            !current_frame.includes(ident.Name)
          ) {
            current_frame.push(ident.Name);
            this.instrs[this.wc++] = { _type: "DEFINE", sym: ident.Name };
          }
          this.instrs[this.wc++] = { _type: "ASSIGN", sym: ident.Name };
          this.instrs[this.wc++] = { _type: "POP" };
        });
      },
      Ident: (astNode: Ident) => {
        const name = astNode.Name;
        let instr: Instruction;
        // Go treats boolean as Ident. Adds a LDC instruction
        // TODO: feel like the proper way to handle this would be to add it to the environment
        // and continue treating it like an Ident / LD instruction
        if (name === "true" || name === "false") {
          instr = {
            _type: "LDC",
            val: name === "true",
          };
        } else {
          instr = {
            _type: "LD",
            sym: name,
            pos: this.cte_position(name),
          };
        }
        this.instrs[this.wc++] = instr;
      },
      ReturnStmt: (astNode: ReturnStmt) => {
        astNode.Results.forEach((result) => {
          this.compile(result);
        });
        this.instrs[this.wc++] = { _type: "RESET" };
      },
      ExprStmt: (astNode: ExprStmt) => {
        this.compile(astNode.X);
      },
      IfStmt: (astNode: IfStmt) => {
        this.compile_conditional(
          astNode.Cond,
          astNode.Body,
          astNode.Else ?? { _type: NodeType.BLOCK_STMT, List: [] },
        );
      },
      ForStmt: (astNode: ForStmt) => {
        const loop_start = this.wc;
        this.compile(astNode.Cond);
        const jump_on_false_instruction: JOF = { _type: "JOF", addr: -1 };
        this.instrs[this.wc++] = jump_on_false_instruction;
        this.compile(astNode.Body);
        this.instrs[this.wc++] = { _type: "POP" };
        this.instrs[this.wc++] = { _type: "GOTO", addr: loop_start };
        jump_on_false_instruction.addr = this.wc;
      },
      IncDecStmt: (astNode: IncDecStmt) => {
        // x++ desugar to x = x + 1
        const one_literal_ast: BasicLit = {
          _type: NodeType.BASIC_LIT,
          Kind: "INT",
          Value: "1",
        };
        const binary_expr_ast: BinaryExpr = {
          _type: NodeType.BINARY_EXPR,
          Op: astNode.Tok === Token.INC ? Token.ADD : Token.SUB,
          X: astNode.X,
          Y: one_literal_ast,
        };
        const assign_stmt_ast: AssignStmt = {
          _type: NodeType.ASSIGN_STMT,
          Lhs: [astNode.X],
          Rhs: [binary_expr_ast],
          Tok: Token.ASSIGN,
        };
        this.compile(assign_stmt_ast);
      },
    };
  }

  private cte_position(name: string): [number, number] {
    for (let i = this.compile_env.length - 1; i >= 0; i--) {
      const frame = this.compile_env[i];
      const j = frame.indexOf(name);
      if (j >= 0) {
        return [i, j];
      }
    }
    throw new Error(`${name} not found in compile-time environment`);
  }

  private compile_conditional(
    pred: Expr,
    cons: Expr | BlockStmt,
    alt: Expr | BlockStmt,
  ) {
    this.compile(pred);
    const jump_on_false_instruction: JOF = { _type: "JOF", addr: -1 };
    this.instrs[this.wc++] = jump_on_false_instruction;
    this.compile(cons);
    const goto_instruction: GOTO = { _type: "GOTO", addr: -1 };
    this.instrs[this.wc++] = goto_instruction;
    jump_on_false_instruction.addr = this.wc;
    this.compile(alt);
    goto_instruction.addr = this.wc;
  }

  private compile(astNode: Node) {
    if (this.compile_ast[astNode._type] !== undefined) {
      this.compile_ast[astNode._type](astNode);
    } else {
      console.error(astNode);
      throw new Error(`${astNode._type} not implemented`); // to make TDD tests fail
    }
  }

  compile_program(rootAstNode: File) {
    const block: BlockStmt = {
      _type: NodeType.BLOCK_STMT,
      List: [...rootAstNode.Decls, main_call],
    };

    this.compile(block);
    this.instrs[this.wc] = { _type: "DONE" };
    return this.instrs;
  }
}
