import { CompilationError } from "../errors";
import { InternalBuiltinNames } from "../internal_builtins";
import * as AST from "../types/ast";
import { DataType } from "../types/data_type";
import { BuiltinFunction } from "../types/index";
import { ENTER_SCOPE, GOTO, Instruction, JOF } from "../types/vm_instructions";
import { peek, strip_quotes, unescape_string } from "../utils";
import {
  MAIN_CALL,
  compoundAssignmentToBinaryOperator,
  make_assign_stmt,
  make_basic_lit,
  make_binary_expr,
  make_block_stmt,
  make_ident,
  noNewVariables,
  typeToDefaultValue,
} from "./utils";

export class GolangCompiler {
  private wc: number;
  private instrs: Array<Instruction>;
  private compile_env: Array<Array<string>>; // stack of arrays

  constructor(external_builtins: Record<string, BuiltinFunction>) {
    this.wc = 0;
    this.instrs = [];
    this.compile_env = [
      [...Object.keys(InternalBuiltinNames), ...Object.keys(external_builtins)],
    ];
  }

  compile_program(rootAstNode: AST.File) {
    const block: AST.BlockStmt = make_block_stmt([
      ...rootAstNode.Decls,
      MAIN_CALL,
    ]);
    this.compile(block);
    this.instrs[this.wc] = { _type: "DONE" };
    return this.instrs;
  }

  private compile(astNode: AST.Node) {
    if (this.compile_ast[astNode._type] === undefined)
      throw new CompilationError(`${astNode._type} not supported`);
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
    throw new CompilationError(`undefined: ${name}`);
  }

  private compile_conditional(
    pred: AST.Expr,
    cons: AST.Expr | AST.BlockStmt,
    alt: AST.Expr | AST.BlockStmt | AST.IfStmt,
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

  private compile_lock_or_unlock(astNode: AST.CallExpr, funcName: string) {
    this.compile(astNode.Args[0]); // mutex addr
    this.instrs[this.wc++] = {
      _type: funcName === "Lock" ? "LOCK" : "UNLOCK",
    };
    return;
  }

  private compile_waitgroup(astNode: AST.CallExpr, funcName: string) {
    // Add(wg, delta)
    if (funcName === "Add") {
      astNode.Args.forEach((arg) => this.compile(arg));
      this.instrs[this.wc++] = {
        _type: "WG_ADD",
      };
      return;
    }
    if (funcName === "Done") {
      // Done(wg)
      this.compile(astNode.Args[0]);
      this.instrs[this.wc++] = {
        _type: "WG_DONE",
      };
      return;
    }
    if (funcName === "Wait") {
      // Wait(wg)
      this.compile(astNode.Args[0]);
      this.instrs[this.wc++] = {
        _type: "WG_WAIT",
      };
      return;
    }
  }

  private compile_ast: Record<AST.NodeType, any> = {
    BasicLit: (astNode: AST.BasicLit) => {
      this.instrs[this.wc++] = {
        _type: "LDC",
        val:
          astNode.Kind === AST.Token.STRING
            ? strip_quotes(unescape_string(astNode.Value as string))
            : Number(astNode.Value), // can handle integers and floating point values
      };
    },
    BinaryExpr: (astNode: AST.BinaryExpr) => {
      if (astNode.Op === AST.Token.LAND) {
        // X && Y is "if X then Y else false"
        const falseExpr: AST.Ident = make_ident("false");
        return this.compile_conditional(astNode.X, astNode.Y, falseExpr);
      }
      if (astNode.Op === AST.Token.LOR) {
        // X || Y is "if X then true else Y"
        const trueExpr: AST.Ident = make_ident("true");
        return this.compile_conditional(astNode.X, trueExpr, astNode.Y);
      }
      this.compile(astNode.X);
      this.compile(astNode.Y);
      this.instrs[this.wc++] = { _type: "BINOP", sym: astNode.Op };
    },
    UnaryExpr: (astNode: AST.UnaryExpr) => {
      this.compile(astNode.X);
      if (astNode.Op === AST.Token.ARROW) {
        this.instrs[this.wc++] = { _type: "RECV" };
      } else {
        this.instrs[this.wc++] = { _type: "UNOP", sym: astNode.Op };
      }
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
    GenDecl: (astNode: AST.GenDecl) => {
      astNode.Specs.forEach((spec) => this.compile(spec));
    },
    ValueSpec: (astNode: AST.ValueSpec) => {
      let Rhs = [];
      if (astNode.Values.length > 0) {
        Rhs = astNode.Values;
      } else {
        // if Values.length == 0, there WILL be a type. otherwise parser will throw err
        const type = astNode.Type.Name;
        Rhs = astNode.Names.map((_) => {
          const defaultVal = typeToDefaultValue.get(type);
          if (!defaultVal)
            throw new CompilationError(`type: ${type} not supported`);
          return defaultVal;
        });
      }
      // desugar to an AssignStmt
      const assignAst: AST.AssignStmt = make_assign_stmt(
        astNode.Names,
        Rhs,
        AST.Token.DEFINE,
      );
      this.compile(assignAst);
    },
    ChanType: (astNode: AST.ChanType) => {
      // ignore; type information is not needed for the VM at runtime
      return;
    },
    CallExpr: (astNode: AST.CallExpr) => {
      let arity = astNode.Args.length;
      if (astNode.Fun.Name === "make") {
        arity = 1; // first argument is the type, ignored at runtime
        if (astNode.Args.length === 1) {
          // desugar make(T) to make(T, 0)
          astNode.Args.push(make_basic_lit(AST.Token.INT, "0"));
        }
      }

      if (astNode.Fun.Name === "Lock" || astNode.Fun.Name === "Unlock") {
        return this.compile_lock_or_unlock(astNode, astNode.Fun.Name);
      }

      if (
        astNode.Fun.Name === "Add" ||
        astNode.Fun.Name === "Done" ||
        astNode.Fun.Name === "Wait"
      ) {
        return this.compile_waitgroup(astNode, astNode.Fun.Name);
      }

      this.compile(astNode.Fun);
      astNode.Args.forEach((arg) => this.compile(arg));
      this.instrs[this.wc++] = { _type: "CALL", arity };
    },
    GoStmt: (astNode: AST.GoStmt) => {
      const call_expr = astNode.Call;
      this.compile(call_expr.Fun);
      call_expr.Args.forEach((arg) => this.compile(arg));
      this.instrs[this.wc++] = {
        _type: "THREAD_CALL",
        arity: call_expr.Args.length,
      };
    },
    SendStmt: (astNode: AST.SendStmt) => {
      this.compile(astNode.Chan);
      this.compile(astNode.Value);
      this.instrs[this.wc++] = { _type: "SEND" };
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
        throw new CompilationError("no new variables on left side of :=");
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
            throw new CompilationError(
              `operator not implemented: ${astNode.Tok}`,
            );
          }
          const desugared: AST.BinaryExpr = make_binary_expr(
            Op,
            astNode.Lhs[i],
            expr,
          );
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

      if (name === DataType.MUTEX) {
        this.instrs[this.wc++] = {
          _type: "MAKE_MUTEX",
        };
        return;
      }

      if (name === DataType.WAITGROUP) {
        this.instrs[this.wc++] = {
          _type: "MAKE_WAITGROUP",
        };
        return;
      }

      // Go treats boolean as Ident. Adds a LDC instruction
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
      const empty_block_stmt: AST.BlockStmt = make_block_stmt([]);
      this.compile_conditional(
        astNode.Cond,
        astNode.Body,
        astNode.Else ?? empty_block_stmt,
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
      const one_literal_ast: AST.BasicLit = make_basic_lit(AST.Token.INT, "1");
      const binary_expr_ast: AST.BinaryExpr = make_binary_expr(
        astNode.Tok === AST.Token.INC ? AST.Token.ADD : AST.Token.SUB,
        astNode.X,
        one_literal_ast,
      );
      const assign_stmt_ast: AST.AssignStmt = make_assign_stmt(
        [astNode.X],
        [binary_expr_ast],
        AST.Token.ASSIGN,
      );
      this.compile(assign_stmt_ast);
    },
    DeclStmt: (astNode: AST.DeclStmt) => {
      this.compile(astNode.Decl);
    },
    BranchStmt: () => {
      throw new CompilationError(`BranchStmt not implemented`);
    },
    FuncType: () => {
      return;
    },
  };
}
