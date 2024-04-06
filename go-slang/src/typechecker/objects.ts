import * as AST from "../types/ast";
import { DataType } from "../types/data_type";
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

export function ident_to_type(val: AST.Ident): Type {
  switch (val.Name) {
    case DataType.INT:
      return INT_TYPE;
    case DataType.BOOL:
      return BOOL_TYPE;
    case DataType.STRING:
      return STRING_TYPE;
    case DataType.MUTEX:
      return MUTEX_TYPE;
    case DataType.WAITGROUP:
      return WAITGROUP_TYPE;
    default:
      throw new Error(`Unknown Ident: ${val}`);
  }
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
      return ident_to_type(astNode as AST.Ident);
    case AST.NodeType.CHAN_TYPE:
      const content_type = ast_to_type((astNode as AST.ChanType).Value);
      return make_channel_type(content_type);
    case AST.NodeType.FUNC_TYPE:
      return ast_to_function_type(astNode as AST.FuncType);
    default:
      return UNDEFINED_TYPE;
  }
}

function ast_to_function_type(func_type: AST.FuncType) {
  const { Params, Results } = func_type;

  const param_types = Params.List.flatMap((param) => {
    if (param.Names.length > 0) {
      return param.Names.map(() => ast_to_type(param.Type));
    } else {
      return ast_to_type(param.Type); // anonymous function type have empty Names array
    }
  });

  let declared_return_type: Type[] = [];
  if (Results) {
    declared_return_type = Results.List.flatMap((e) => ast_to_type(e.Type));
  }

  return make_function_type(param_types, declared_return_type);
}

export function make_channel_type(val: Type): Type {
  return { _type: Types.CHANNEL, val };
}
