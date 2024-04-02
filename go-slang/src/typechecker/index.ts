import * as AST from "../types/ast";

import {
  Type,
  LiteralType,
  FunctionType,
  Types,
  UndefinedType,
  ReturnType,
} from "../types/typing";

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
  make_function_type,
  make_return_type,
  make_undefined_type,
} from "./utils";
import { BuiltinFunction, DataType } from "../types";
import { pluralize } from "../utils";
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
    const env_frame: Record<string, Type> = {};
    names.forEach((name, i) => {
      env_frame[name] = types[i];
    });
    this.type_env.push(env_frame);
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
        return;
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
    FuncDecl: (astNode: AST.FuncDecl): FunctionType => {
      // TODO: Handle higher order function. For now only literal return types.
      const param_names = astNode.Type.Params.List.flatMap((e) =>
        e.Names.map((name) => name.Name),
      );
      const param_types = astNode.Type.Params.List.flatMap((e) =>
        make_literal_type(e.Type.Name),
      );
      this.extend_env(param_names, param_types);

      let declared_return_type: Type[] = [];
      if (astNode.Type.Results) {
        declared_return_type = astNode.Type.Results.List.flatMap((e) =>
          make_literal_type(e.Type.Name),
        );
      }
      const actual_result_type: Type = this.type(astNode.Body);

      // skip typecheck for main function
      if (astNode.Name.Name === "main") {
        return make_function_type(param_types, declared_return_type);
      }

      if (
        declared_return_type.length > 0 &&
        actual_result_type._type !== Types.RETURN
      ) {
        throw new TypeError(`${astNode.Name.Name}: missing return`);
      }

      if (
        actual_result_type._type === Types.RETURN &&
        !is_equal_types(
          declared_return_type,
          (actual_result_type as ReturnType).res,
        )
      ) {
        throw new TypeError(
          `${astNode.Name.Name}: cannot use ${stringify_types(
            (actual_result_type as ReturnType).res,
          )} as ${stringify_types(
            declared_return_type,
          )} value in return statement`,
        );
      }

      this.type_env.pop();

      const func_type: FunctionType = make_function_type(
        param_types,
        declared_return_type,
      );
      return func_type;
    },
    GenDecl: (astNode: AST.GenDecl) => {
      return;
    },
    ValueSpec: (astNode: AST.ValueSpec) => {
      return;
    },
    ChanType: (astNode: AST.ChanType) => {
      return;
    },
    CallExpr: (astNode: AST.CallExpr) => {
      console.log(this.type_env)
      const fun_type = this.type(astNode.Fun) as FunctionType;
      console.log("funtype:", fun_type)
      if (fun_type._type !== Types.FUNCTION)
        throw new TypeError(`${astNode.Fun.Name} expects a function type`);
      const expected_arg_types: Type[] = fun_type.args;
      const actual_arg_types: Type[] = astNode.Args.map((e) => this.type(e));
      if (is_equal_types(expected_arg_types, actual_arg_types))
        return fun_type.res;
      throw new TypeError(
        `${astNode.Fun.Name} expects ${stringify_types(
          expected_arg_types,
        )}, but got ${stringify_types(actual_arg_types)}`,
      );
    },
    GoStmt: (astNode: AST.GoStmt) => {
      return;
    },
    SendStmt: (astNode: AST.SendStmt) => {
      return;
    },
    BlockStmt: (astNode: AST.BlockStmt): Type => {
      const func_decls = astNode.List.filter(
        (val) => val._type === AST.NodeType.FUNC_DECL,
      );
      const func_types = func_decls.map((func) =>
        this.type(func as AST.FuncDecl),
      );
      const func_names = func_decls.map(
        (func) => (func as AST.FuncDecl).Name.Name,
      );
      this.extend_env(func_names, func_types);
      const stmts = astNode.List;
      for (let i = 0; i < stmts.length; i++) {
        const stmt_type = this.type(stmts[i]);
        if (stmt_type._type === Types.RETURN) return stmt_type;
      }
      this.type_env.pop();
      return make_undefined_type();
    },
    AssignStmt: (astNode: AST.AssignStmt) => {
      const curr_env_frame = peek(this.type_env);

      const rhs_types = astNode.Rhs.map((expr) => this.type(expr));
      if (astNode.Lhs.length != rhs_types.length) {
        throw new TypeError(
          `assignment mismatch: ${astNode.Lhs.length} ${pluralize(
            "variable",
            astNode.Lhs.length,
          )} but ${rhs_types.length} ${pluralize("value", rhs_types.length)}`,
        );
      }

      // TODO: handle function returns

      if (astNode.Tok === AST.Token.DEFINE) {
        astNode.Lhs.forEach((ident, i) => {
          curr_env_frame[ident.Name] = rhs_types[i];
        });
      } else {
        const curr_lhs_types = astNode.Lhs.map((ident) => this.type(ident));
        for (let i = 0; i < curr_lhs_types.length; i++) {
          if (!is_equal_type(curr_lhs_types[i], rhs_types[i])) {
            throw new TypeError(
              `cannot use ${stringify_type(rhs_types[i])} as ${stringify_type(
                curr_lhs_types[i],
              )} value in assignment`,
            );
          }
        }
      }
    },
    Ident: (astNode: AST.Ident): Type | Type[] => {
      const name = astNode.Name;
      if (name === "true" || name === "false") {
        return make_literal_type(DataType.BOOL);
      }
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
      return;
    },
    ForStmt: (astNode: AST.ForStmt) => {
      return;
    },
    IncDecStmt: (astNode: AST.IncDecStmt) => {
      return;
    },
    DeclStmt: (astNode: AST.DeclStmt) => {
      return;
    },
    File: () => {
      return;
    },
    BranchStmt: () => {
      return;
    },
  };
}
