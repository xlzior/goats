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
  make_function_type,
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
    FuncDecl: (astNode: AST.FuncDecl) => {
      // const params = astNode.Type.Params.List.flatMap((e) =>
        // e.Names.map((name) => name.Name),
      // );
      // const paramTypes = params.map(name => make_literal_type(name))

      // // this.type_env.push({}); // params
      // // this.type_env.pop();
      // const declaredReturns = astNode.Type.Results?.List.flatMap((e) =>
        // e.Names.map((name) => name.Name),
      // );
      // const declaredReturnTypes = declaredReturns.map(name => make_literal_type(name));

      const actual_result_type = this.type(astNode.Body);
      // const func_type: FunctionType = make_function_type(paramTypes, result_type);
      // return func_type
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
      const fun_type = this.type(astNode.Fun) as FunctionType;
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
    BlockStmt: (astNode: AST.BlockStmt) => {
      // filter by func decl stmts
      const func_decls = astNode.List.filter(
        (val) => val._type === AST.NodeType.FUNC_DECL,
      );

      // evaluate the types of the functions
      const func_types = func_decls.map((func) => this.type(func));

      // // map to its function name
      const func_names = func_decls.map(
        (func) => (func as AST.FuncDecl).Name.Name,
      );

      const env_frame: Record<string, Type> = {};

      func_names.forEach((name, i) => {
        env_frame[name] = func_types[i];
      });
      this.type_env.push(env_frame);

      astNode.List.forEach((stmt) => this.type(stmt));

      this.type_env.pop();
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
      return;
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
