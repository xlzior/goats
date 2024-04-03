import { DataType } from "../types";
import * as AST from "../types/ast";
import {
  AnyType,
  FunctionType,
  LiteralType,
  MutexType,
  ReturnType,
  Type,
  Types,
  UndefinedType,
  WaitGroupType,
} from "../types/typing";
import { is_equal_type } from "./utils";

// ===========================================
// SINGLETON TYPES
// ===========================================

export const UNDEFINED_TYPE: UndefinedType = {
  _type: Types.UNDEFINED,
};

export const ANY_TYPE: AnyType = {
  _type: Types.ANY,
};

export const INT_TYPE: LiteralType = {
  _type: Types.LITERAL,
  val: DataType.INT,
};

export const BOOL_TYPE: LiteralType = {
  _type: Types.LITERAL,
  val: DataType.BOOL,
};

export const STRING_TYPE: LiteralType = {
  _type: Types.LITERAL,
  val: DataType.STRING,
};

export const MUTEX_TYPE: MutexType = {
  _type: Types.MUTEX,
};

export const WAITGROUP_TYPE: WaitGroupType = {
  _type: Types.WAITGROUP,
};

// ===========================================
// HELPER METHODS TO CHECK TYPE OBJECTS
// ===========================================

export function is_bool_literal(type: Type): boolean {
  return type._type === Types.LITERAL && type.val === DataType.BOOL;
}

export function is_int_literal(type: Type): boolean {
  return type._type === Types.LITERAL && type.val === DataType.INT;
}

// ===========================================
// HELPER METHODS TO RECONSTRUCT TYPE OBJECTS
// ===========================================

export function make_literal_type(val: string): LiteralType {
  return { _type: Types.LITERAL, val };
}

export function make_return_type(res: Type[]): ReturnType {
  return { _type: Types.RETURN, res };
}

export function make_function_type(args: Type[], res: Type[]): FunctionType {
  return { _type: Types.FUNCTION, args, res };
}

export function ast_to_type(astNode: AST.Node): Type {
  switch (astNode._type) {
    case AST.NodeType.IDENT:
      return make_literal_type((astNode as AST.Ident).Name);
    case AST.NodeType.CHAN_TYPE:
      const content_type = ast_to_type((astNode as AST.ChanType).Value);
      return make_channel_type(content_type);
    case AST.NodeType.FUNC_DECL:
      return ast_to_function_type(astNode as AST.FuncDecl);
    default:
      return UNDEFINED_TYPE;
  }
}

function ast_to_function_type(astNode: AST.FuncDecl) {
  const { Params, Results } = astNode.Type;
  const param_types = Params.List.flatMap((e) =>
    e.Names.map(() => ast_to_type(e.Type)),
  );

  let declared_return_type: Type[] = [];
  if (Results) {
    declared_return_type = Results.List.flatMap((e) => ast_to_type(e.Type));
  }

  return make_function_type(param_types, declared_return_type);
}

export function make_union_type(types: Type[]): Type {
  if (types.length === 0) return UNDEFINED_TYPE;

  const deduped_types: Type[] = [];
  for (const type of types) {
    const exists = deduped_types.some((x) => is_equal_type(type, x));
    if (!exists) deduped_types.push(type);
  }
  if (deduped_types.length === 1) return types[0];

  return {
    _type: Types.UNION,
    types: deduped_types,
  };
}

export function type_union(type1: Type, type2: Type): Type {
  if (is_equal_type(type1, type2)) return type1;

  const types_in_1 = type1._type === Types.UNION ? type1.types : [type1];
  const types_in_2 = type2._type === Types.UNION ? type2.types : [type2];

  return make_union_type([...types_in_1, ...types_in_2]);
}

export function make_channel_type(val: Type): Type {
  return {
    _type: Types.CHANNEL,
    val,
  };
}
