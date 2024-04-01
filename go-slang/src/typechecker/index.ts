import * as AST from "../types/ast";

import { Type, LiteralType, FunctionType } from "../types/typing";

import { TypeError } from "../errors";
import {
  make_call_expr,
  make_ident,
} from "../compiler/utils";
import {
  global_type_frame,
  make_literal_type,
  is_equal_types,
  stringify_types,
  stringify_multiple_types,
} from "./utils";
import { BuiltinFunction, DataType } from "../types";

export class GolangTypechecker {
  private type_env: Array<Record<string, any>>;

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
      // binary expr is treated as a function call with 2 params
      const call_expr_ast: AST.CallExpr = make_call_expr(
        [astNode.X, astNode.Y],
        make_ident(astNode.Op as string),
      );
      return this.type(call_expr_ast);
    },
    UnaryExpr: (astNode: AST.UnaryExpr) => {
      if (astNode.Op === AST.Token.ARROW) {
        return;
      } else {
        const call_expr_ast: AST.CallExpr = make_call_expr(
          [astNode.X],
          make_ident(astNode.Op as string),
        );
        return this.type(call_expr_ast);
      }
    },
    ParenExpr: (astNode: AST.ParenExpr) => {
      return this.type(astNode.X);
    },
    FuncDecl: (astNode: AST.FuncDecl) => {
      this.type_env.push([]); // params
      this.type(astNode.Body);
      this.type_env.pop();
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
      const fun_type = this.type(astNode.Fun) as FunctionType | FunctionType[];
      // if (fun_type[0]._type !== Types.FUNCTION || fun_type._type !== Types.FUNCTION) {
      //   throw new TypeError(
      //     `Function ${astNode.Fun.Name} expects a function type`,
      //   );
      // }

      const actual_arg_types: Type[] = astNode.Args.map((e) => this.type(e));

      if (Array.isArray(fun_type)) { // has multiple types
        for (let i = 0; i < fun_type.length; i++) {
          const expected_arg_types: Type[] = fun_type[i].args;
          if (is_equal_types(actual_arg_types, expected_arg_types))
            return fun_type[i].res;
        }
        throw new TypeError(
          `${astNode.Fun.Name} expects ${stringify_multiple_types(
            fun_type,
          )}, but got ${stringify_types(actual_arg_types)}`,
        );
      }

      const expected_arg_types: Type[] = fun_type.args;
      if (is_equal_types(actual_arg_types, expected_arg_types))
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
      this.type_env.push([]);
      astNode.List.forEach((stmt) => this.type(stmt));
      this.type_env.pop();
    },
    AssignStmt: (astNode: AST.AssignStmt) => {
      return;
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
