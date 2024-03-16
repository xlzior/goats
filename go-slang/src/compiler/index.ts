import { BuiltinFunction } from "../types";
import * as AST from "../types/ast";
import { GOTO, JOF, Instruction, ENTER_SCOPE } from "../types/vm_instructions";

import { peek } from "../utils";
import {
  MAIN_CALL,
  stripQuotes,
  noNewVariables,
  compoundAssignmentToBinaryOperator,
} from "./utils";

export class GolangCompiler {
  private wc: number;
  private instrs: Array<Instruction>;
  private compile_env: Array<Array<string>>; // stack of arrays

  constructor(builtin_mapping: Record<string, BuiltinFunction>) {
    this.wc = 0;
    this.instrs = [];
    this.compile_env = [Object.keys(builtin_mapping)];
  }

  compile_program(rootAstNode: AST.File) {
    const block: AST.BlockStmt = {
      _type: AST.NodeType.BLOCK_STMT,
      List: [...rootAstNode.Decls, MAIN_CALL],
    };

    this.compile(block);
    this.instrs[this.wc] = { _type: "DONE" };
    return this.instrs;
  }

  private compile(astNode: AST.Node) {
    this.compile_ast[astNode._type](astNode);
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
    pred: AST.Expr,
    cons: AST.Expr | AST.BlockStmt,
    alt: AST.Expr | AST.BlockStmt,
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

  private compile_ast: Record<AST.NodeType, any> = {
    BasicLit: (astNode: AST.BasicLit) => {
      this.instrs[this.wc++] = {
        _type: "LDC",
        val:
          astNode.Kind === "STRING"
            ? stripQuotes(astNode.Value as string)
            : Number(astNode.Value), // can handle integers and floating point values
      };
    },
    BinaryExpr: (astNode: AST.BinaryExpr) => {
      if (astNode.Op === AST.Token.LAND) {
        // X && Y is "if X then Y else false"
        const falseExpr: AST.Ident = {
          _type: AST.NodeType.IDENT,
          Name: "false",
        };
        return this.compile_conditional(astNode.X, astNode.Y, falseExpr);
      }
      if (astNode.Op === AST.Token.LOR) {
        // X || Y is "if X then true else Y"
        const trueExpr: AST.Ident = { _type: AST.NodeType.IDENT, Name: "true" };
        return this.compile_conditional(astNode.X, trueExpr, astNode.Y);
      }
      this.compile(astNode.X);
      this.compile(astNode.Y);
      this.instrs[this.wc++] = { _type: "BINOP", sym: astNode.Op };
    },
    UnaryExpr: (astNode: AST.UnaryExpr) => {
      this.compile(astNode.X);
      this.instrs[this.wc++] = { _type: "UNOP", sym: astNode.Op };
    },
    ParenExpr: (astNode: AST.ParenExpr) => {
      this.compile(astNode.X);
    },
    FuncDecl: (astNode: AST.FuncDecl) => {
      const params = astNode.Type.Params.List.flatMap((e) =>
        e.Names.map((name) => name.Name),
      );
      this.compile_env.push(params);
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
      this.compile_env.pop();

      this.instrs[this.wc++] = {
        _type: "ASSIGN",
        sym: astNode.Name.Name,
        pos: this.cte_position(astNode.Name.Name),
      };
    },
    CallExpr: (astNode: AST.CallExpr) => {
      this.compile(astNode.Fun);
      astNode.Args.forEach((arg) => this.compile(arg));
      this.instrs[this.wc++] = { _type: "CALL", arity: astNode.Args.length };
    },
    BlockStmt: (astNode: AST.BlockStmt) => {
      // empty block
      if (astNode.List.length === 0) {
        this.instrs[this.wc++] = { _type: "LDC", val: undefined };
        return;
      }

      const func_decls = astNode.List.filter(
        (val) => val._type === AST.NodeType.FUNC_DECL,
      ).map((func) => (func as AST.FuncDecl).Name.Name);
      this.compile_env.push(func_decls);
      const enter_scope_instr: ENTER_SCOPE = { _type: "ENTER_SCOPE", num: 0 };
      this.instrs[this.wc++] = enter_scope_instr;

      astNode.List.forEach((stmt, i) => {
        this.compile(stmt);
        if (i < astNode.List.length - 1) {
          this.instrs[this.wc++] = { _type: "POP" };
        }
      });

      this.instrs[this.wc++] = { _type: "EXIT_SCOPE" };
      enter_scope_instr.num = peek(this.compile_env).length;
      this.compile_env.pop();
    },
    AssignStmt: (astNode: AST.AssignStmt) => {
      const current_frame = peek(this.compile_env);
      if (
        astNode.Tok === AST.Token.DEFINE &&
        noNewVariables(astNode.Lhs, current_frame)
      ) {
        throw new Error("no new variables on left side of :=");
      }

      astNode.Rhs.forEach((expr, i) => {
        if (
          astNode.Tok === AST.Token.DEFINE ||
          astNode.Tok === AST.Token.ASSIGN
        ) {
          // simple assignment
          this.compile(expr);
        } else {
          // compound assignment: +=, -=, *=, /= etc
          const Op = compoundAssignmentToBinaryOperator.get(astNode.Tok);
          if (Op === undefined) {
            throw new Error(`operator not implemented: ${astNode.Tok}`);
          }
          const desugared: AST.BinaryExpr = {
            _type: AST.NodeType.BINARY_EXPR,
            Op,
            X: astNode.Lhs[i],
            Y: expr,
          };
          this.compile(desugared);
        }
      });

      astNode.Lhs.reverse().forEach((ident, i) => {
        if (
          astNode.Tok === AST.Token.DEFINE &&
          !current_frame.includes(ident.Name)
        ) {
          current_frame.push(ident.Name);
        }
        this.instrs[this.wc++] = {
          _type: "ASSIGN",
          sym: ident.Name,
          pos: this.cte_position(ident.Name),
        };
        if (i < astNode.Lhs.length - 1) {
          this.instrs[this.wc++] = { _type: "POP" };
        }
      });
    },
    Ident: (astNode: AST.Ident) => {
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
    ReturnStmt: (astNode: AST.ReturnStmt) => {
      astNode.Results.forEach((result) => {
        this.compile(result);
      });
      this.instrs[this.wc++] = { _type: "RESET" };
    },
    ExprStmt: (astNode: AST.ExprStmt) => {
      this.compile(astNode.X);
    },
    IfStmt: (astNode: AST.IfStmt) => {
      this.compile_conditional(
        astNode.Cond,
        astNode.Body,
        astNode.Else ?? { _type: AST.NodeType.BLOCK_STMT, List: [] },
      );
    },
    ForStmt: (astNode: AST.ForStmt) => {
      const loop_start = this.wc;
      this.compile(astNode.Cond);
      const jump_on_false_instruction: JOF = { _type: "JOF", addr: -1 };
      this.instrs[this.wc++] = jump_on_false_instruction;
      this.compile(astNode.Body);
      this.instrs[this.wc++] = { _type: "POP" };
      this.instrs[this.wc++] = { _type: "GOTO", addr: loop_start };
      jump_on_false_instruction.addr = this.wc;
    },
    IncDecStmt: (astNode: AST.IncDecStmt) => {
      // x++ desugar to x = x + 1
      const one_literal_ast: AST.BasicLit = {
        _type: AST.NodeType.BASIC_LIT,
        Kind: "INT",
        Value: "1",
      };
      const binary_expr_ast: AST.BinaryExpr = {
        _type: AST.NodeType.BINARY_EXPR,
        Op: astNode.Tok === AST.Token.INC ? AST.Token.ADD : AST.Token.SUB,
        X: astNode.X,
        Y: one_literal_ast,
      };
      const assign_stmt_ast: AST.AssignStmt = {
        _type: AST.NodeType.ASSIGN_STMT,
        Lhs: [astNode.X],
        Rhs: [binary_expr_ast],
        Tok: AST.Token.ASSIGN,
      };
      this.compile(assign_stmt_ast);
    },
    File: () => {
      throw new Error(`File not implemented`);
    },
    BranchStmt: () => {
      throw new Error(`BranchStmt not implemented`);
    },
  };
}
