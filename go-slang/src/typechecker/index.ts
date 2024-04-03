import * as AST from "../types/ast";

import { Type, LiteralType, FunctionType, Types } from "../types/typing";

import { TypeError } from "../errors";
import { make_call_expr, make_ident } from "../compiler/utils";
import {
  global_type_frame,
  make_literal_type,
  is_equal_types,
  stringify_types,
  check_special_binary_expr_type,
  is_equal_type,
  stringify_type,
  make_return_type,
  make_undefined_type,
  make_function_type_from_ast,
  is_bool_literal,
  type_union,
  make_union_type,
  check_return_type,
  check_lhs_rhs_types,
  check_lhs_rhs_equal_length,
  make_channel_type,
  make_type_from_ast,
  is_int_literal,
  MUTEX_TYPE,
  WAITGROUP_TYPE,
} from "./utils";
import { BuiltinFunction, DataType } from "../types";
import { peek } from "../utils";

export class GolangTypechecker {
  private type_env: Array<Record<string, Type>>;

  constructor(external_builtins: Record<string, BuiltinFunction>) {
    this.type_env = [global_type_frame];
  }

  public check_type(rootAstNode: AST.File): void {
    const block: AST.BlockStmt = {
      _type: AST.NodeType.BLOCK_STMT,
      List: [...rootAstNode.Decls],
    };
    this.type(block);
  }

  private type(astNode: AST.Node): Type {
    if (this.type_ast[astNode._type] === undefined)
      // throw new TypeError(`${astNode._type} not supported`);
      return {} as Type;
    return this.type_ast[astNode._type](astNode);
  }

  private lookup_type(name: string): Type | Type[] {
    for (let i = this.type_env.length - 1; i >= 0; i--) {
      const frame = this.type_env[i];
      if (frame.hasOwnProperty(name)) return frame[name];
    }
    throw new TypeError(`undefined: ${name}`);
  }

  private extend_env(names: string[], types: Type[]): void {
    const new_env_frame: Record<string, Type> = {};
    names.forEach((name, i) => {
      new_env_frame[name] = types[i];
    });
    this.type_env.push(new_env_frame);
  }

  private check_make_call(astNode: AST.CallExpr) {
    if (astNode.Args.length !== 1 && astNode.Args.length !== 2)
      throw new TypeError(
        `invalid operation: make expects 1 or 2 arguments; found ${astNode.Args.length}`,
      );

    const first_arg = this.type(astNode.Args[0]);
    if (first_arg._type !== Types.CHANNEL) {
      throw new TypeError(
        `invalid argument: cannot make ${stringify_type(
          first_arg,
        )}; type must be channel`,
      );
    }

    if (astNode.Args.length === 2) {
      const second_arg = this.type(astNode.Args[1]);
      if (!is_int_literal(second_arg))
        throw new TypeError(
          `cannot convert ${stringify_type(second_arg)} to type int`,
        );
    }
    return first_arg;
  }

  private check_function_call(astNode: AST.CallExpr) {
    if (astNode.Fun.Name === "make") {
      return this.check_make_call(astNode);
    }

    const fun_type = this.type(astNode.Fun);
    if (fun_type._type !== Types.FUNCTION)
      throw new TypeError(
        `invalid operation: cannot call non-function ${astNode.Fun.Name}`,
      );
    const expected_arg_types: Type[] = fun_type.args;
    const actual_arg_types: Type[] = astNode.Args.map((e) => this.type(e));
    if (
      is_equal_types(
        expected_arg_types,
        actual_arg_types,
        `too many arguments in call to ${astNode.Fun.Name}`,
        `not enough arguments in call to ${astNode.Fun.Name}`,
      )
    ) {
      const results = fun_type.res;
      if (results.length === 0) return make_undefined_type();
      if (results.length === 1) return results[0];
      return make_return_type(results);
    }

    throw new TypeError(
      `${astNode.Fun.Name} expects ${stringify_types(
        expected_arg_types,
      )}, but got ${stringify_types(actual_arg_types)}`,
    );
  }

  private type_ast: Record<AST.NodeType, any> = {
    // base case
    BasicLit: (astNode: AST.BasicLit): LiteralType => {
      switch (astNode.Kind) {
        case AST.Token.INT:
          return make_literal_type(DataType.INT);
        case AST.Token.STRING:
          return make_literal_type(DataType.STRING);
        default:
          throw new TypeError(`type: ${astNode.Kind} not supported`);
      }
    },
    BinaryExpr: (astNode: AST.BinaryExpr) => {
      // handle +, >, >=, <, <=, ==, != separately because they are "overloaded" methods
      const op = astNode.Op;
      if (
        op === AST.Token.ADD ||
        op === AST.Token.EQL ||
        op === AST.Token.LSS ||
        op === AST.Token.GTR ||
        op === AST.Token.NEQ ||
        op === AST.Token.LEQ ||
        op === AST.Token.GEQ
      ) {
        return check_special_binary_expr_type(
          op,
          this.type(astNode.X),
          this.type(astNode.Y),
        );
      }

      // the rest are treated as function call with 2 params
      const call_expr_ast: AST.CallExpr = make_call_expr(
        [astNode.X, astNode.Y],
        make_ident(astNode.Op as string),
      );
      return this.type(call_expr_ast);
    },
    UnaryExpr: (astNode: AST.UnaryExpr) => {
      if (astNode.Op === AST.Token.ARROW) {
        const chan_type = this.type(astNode.X);
        if (chan_type._type !== Types.CHANNEL)
          throw new TypeError(
            `invalid operation: cannot receive from non-channel type ${stringify_type(
              chan_type,
            )}`,
          );
        return chan_type.val;
      }
      if (astNode.Op === AST.Token.SUB) {
        const call_expr_ast: AST.CallExpr = make_call_expr(
          [astNode.X],
          make_ident("-unary"),
        );
        return this.type(call_expr_ast);
      }
      const call_expr_ast: AST.CallExpr = make_call_expr(
        [astNode.X],
        make_ident(astNode.Op as string),
      );
      return this.type(call_expr_ast);
    },
    ParenExpr: (astNode: AST.ParenExpr) => {
      return this.type(astNode.X);
    },
    FuncDecl: (astNode: AST.FuncDecl) => {
      // TODO: Handle higher order function. For now only literal return types
      const params = astNode.Type.Params.List;
      const param_names = params.flatMap((e) => e.Names.map((x) => x.Name));

      const func_type = this.type(astNode.Name) as FunctionType;
      const param_types = func_type.args;
      const declared_return_type = func_type.res as Type[];

      this.extend_env(param_names, param_types);

      const actual_result_type: Type = this.type(astNode.Body);

      // skip return type check for main function because technically it doesn't have a return
      if (astNode.Name.Name === "main") {
        this.type_env.pop();
        return make_undefined_type();
      }

      if (actual_result_type._type === Types.UNION) {
        actual_result_type.types.forEach((type) => {
          check_return_type(astNode.Name.Name, type, declared_return_type);
        });
      }

      if (
        declared_return_type.length > 0 &&
        actual_result_type._type !== Types.RETURN
      ) {
        throw new TypeError(`${astNode.Name.Name}: missing return`);
      }

      check_return_type(
        astNode.Name.Name,
        actual_result_type,
        declared_return_type,
      );

      this.type_env.pop();
      return make_undefined_type();
    },
    GenDecl: (astNode: AST.GenDecl) => {
      astNode.Specs.forEach((spec) => this.type(spec));
      return make_undefined_type();
    },
    ValueSpec: (astNode: AST.ValueSpec) => {
      const curr_env_frame = peek(this.type_env);

      if (astNode.Values.length > 0) {
        check_lhs_rhs_equal_length(astNode.Names.length, astNode.Values.length);

        const rhs_types = astNode.Values.map((expr) => this.type(expr));
        if (astNode.Type) {
          const lhs_types = astNode.Names.map((_) =>
            make_literal_type(astNode.Type.Name),
          );
          check_lhs_rhs_types(lhs_types, rhs_types, "variable declaration");
        }

        astNode.Names.forEach((name, i) => {
          curr_env_frame[name.Name] = rhs_types[i];
        });
        return;
      }

      // if rhs has no values, lhs must have declared type(s)
      const lhs_types = astNode.Names.map((_) =>
        make_literal_type(astNode.Type.Name),
      );
      astNode.Names.forEach((name, i) => {
        curr_env_frame[name.Name] = lhs_types[i];
      });
    },
    ChanType: (astNode: AST.ChanType) => {
      return make_channel_type(make_type_from_ast(astNode.Value));
    },
    CallExpr: (astNode: AST.CallExpr) => {
      return this.check_function_call(astNode);
    },
    GoStmt: (astNode: AST.GoStmt) => {
      // TODO: write tests for this
      return this.check_function_call(astNode.Call);
    },
    SendStmt: (astNode: AST.SendStmt) => {
      const chan_type = this.type(astNode.Chan);
      if (chan_type._type !== Types.CHANNEL)
        throw new TypeError(
          `invalid operation: cannot send to non-channel type ${stringify_type(
            chan_type,
          )}`,
        );

      const value_type = this.type(astNode.Value);
      if (!is_equal_type(chan_type.val, value_type)) {
        throw new TypeError(
          `cannot use ${stringify_type(value_type)} as type ${stringify_type(
            chan_type.val,
          )} in send`,
        );
      }

      return make_undefined_type();
    },
    BlockStmt: (astNode: AST.BlockStmt): Type => {
      const func_decls = astNode.List.filter(
        (val) => val._type === AST.NodeType.FUNC_DECL,
      );
      const func_names = func_decls.map(
        (func) => (func as AST.FuncDecl).Name.Name,
      );
      const func_types = func_decls.map((func) =>
        make_function_type_from_ast(func as AST.FuncDecl),
      );

      this.extend_env(func_names, func_types);
      const stmts = astNode.List;
      let types_seen: Type[] = [];
      for (let i = 0; i < stmts.length; i++) {
        const stmt_type = this.type(stmts[i]);
        if (stmt_type._type === Types.UNION) {
          types_seen.push(...stmt_type.types);
        }
        if (stmt_type._type === Types.RETURN) {
          types_seen.push(stmt_type);
          // since we have top-level return, function always returns; drop undefined
          types_seen = types_seen.filter((x) => x._type === Types.RETURN);
        }
      }
      // no top-level return, function may not always return; do not drop undefined
      this.type_env.pop();
      return make_union_type(types_seen);
    },
    AssignStmt: (astNode: AST.AssignStmt) => {
      const curr_env_frame = peek(this.type_env);

      let rhs_types = astNode.Rhs.map((expr) => this.type(expr));
      if (rhs_types.length === 1 && rhs_types[0]._type === Types.RETURN) {
        rhs_types = rhs_types[0].res;
      }
      check_lhs_rhs_equal_length(astNode.Lhs.length, rhs_types.length);

      // TODO: handle function returns
      if (astNode.Tok === AST.Token.DEFINE) {
        astNode.Lhs.forEach((ident, i) => {
          curr_env_frame[ident.Name] = rhs_types[i];
        });
      } else {
        const curr_lhs_types = astNode.Lhs.map((ident) => this.type(ident));
        check_lhs_rhs_types(curr_lhs_types, rhs_types, "assignment");
      }
      return make_undefined_type();
    },
    Ident: (astNode: AST.Ident): Type | Type[] => {
      const name = astNode.Name;
      if (name === "true" || name === "false") {
        return make_literal_type(DataType.BOOL);
      }
      if (name === DataType.MUTEX) return MUTEX_TYPE;
      if (name === DataType.WAITGROUP) return WAITGROUP_TYPE;
      return this.lookup_type(name);
    },
    ReturnStmt: (astNode: AST.ReturnStmt) => {
      const expr_types = astNode.Results.map((expr) => this.type(expr));
      return make_return_type(expr_types);
    },
    ExprStmt: (astNode: AST.ExprStmt) => {
      return this.type(astNode.X);
    },
    IfStmt: (astNode: AST.IfStmt) => {
      const cond_type = this.type(astNode.Cond);
      if (!is_bool_literal(cond_type))
        throw new TypeError("non-boolean condition in if statement");

      const then_type = this.type(astNode.Body);
      const else_type = astNode.Else
        ? this.type(astNode.Else)
        : make_undefined_type();

      if (is_equal_type(then_type, else_type)) return then_type;

      return type_union(then_type, else_type);
    },
    ForStmt: (astNode: AST.ForStmt) => {
      return make_undefined_type();
    },
    IncDecStmt: (astNode: AST.IncDecStmt) => {
      if (astNode.X._type !== AST.NodeType.IDENT)
        throw new TypeError(
          `invalid operation ${astNode.Tok} on non-identifier type`,
        );
      const ident_type = this.type(astNode.X);
      if (!is_equal_type(ident_type, make_literal_type(DataType.INT)))
        throw new TypeError(
          `invalid operation ${astNode.Tok} on type ${stringify_type(
            ident_type,
          )}`,
        );
      return make_undefined_type();
    },
    DeclStmt: (astNode: AST.DeclStmt) => {
      this.type(astNode.Decl);
      return make_undefined_type();
    },
    File: () => {
      return;
    },
    BranchStmt: () => {
      return;
    },
  };
}
