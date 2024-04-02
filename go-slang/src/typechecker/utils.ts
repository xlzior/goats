import * as AST from "../types/ast";
import {
  FunctionType,
  LiteralType,
  ReturnType,
  Type,
  Types,
  UndefinedType,
} from "../types/typing";
import { DataType } from "../types";
import { TypeError } from "../errors";

const unary_arith_type: FunctionType = make_function_type(
  [make_literal_type(DataType.INT)],
  make_literal_type(DataType.INT),
);

const unary_bool_type: FunctionType = make_function_type(
  [make_literal_type(DataType.BOOL)],
  make_literal_type(DataType.BOOL),
);

const binary_arith_type: FunctionType = make_function_type(
  [make_literal_type(DataType.INT), make_literal_type(DataType.INT)],
  make_literal_type(DataType.INT),
);

const binary_bool_type: FunctionType = make_function_type(
  [make_literal_type(DataType.BOOL), make_literal_type(DataType.BOOL)],
  make_literal_type(DataType.BOOL),
);

// TODO: Handle builtin function typechecking separately?
const builtin_func_types: Record<string, Type | Type[]> = {
  Println: make_function_type(
    [make_literal_type(DataType.STRING)],
    make_literal_type(DataType.STRING),
  ),
  Sleep: make_function_type(
    [make_literal_type(DataType.INT)],
    make_literal_type(DataType.STRING),
  ),
};

export const global_type_frame: Record<string, Type> = {
  "-": binary_arith_type,
  "*": binary_arith_type,
  "/": binary_arith_type,
  "%": binary_arith_type,
  "&&": binary_bool_type,
  "||": binary_bool_type,
  "-unary": unary_arith_type,
  "!": unary_bool_type,
  ...builtin_func_types,
};

// ===========================================

/**
 * Checks that types of left_operand and right_operand are the same, except booleans
 */
export function check_special_binary_expr_type(
  op: AST.Token,
  left_operand_type: any,
  right_operand_type: any,
) {
  if (
    left_operand_type.val === DataType.BOOL ||
    right_operand_type.val === DataType.BOOL ||
    !is_equal_type(left_operand_type, right_operand_type)
  ) {
    throw new TypeError(
      `${op} expects [int, int] or [string, string], but got ${stringify_types([
        left_operand_type,
        right_operand_type,
      ])}`,
    );
  }
  return left_operand_type;
}

/**
 * Converts a Type object to a String representation
 * Example: { _type: "Literal", val: "int"} -> "int"
 */
export function stringify_type(type: any): string {
  if (type._type === Types.UNDEFINED) {
    return "undefined";
  }
  if (type._type === Types.LITERAL) {
    return type.val;
  }
  throw new TypeError("Type does not exist");
}

/**
 * Converts an array of Type object to a String representation
 * Example: [{ _type: "Literal", val: "int"}, { _type: "Literal", val: "string"}] -> ["int", "string"]
 *
 * @returns String enclosed by square brackets
 */
export function stringify_types(type_arr: Type[]): string {
  const type_arr_in_str = type_arr.map((t) => stringify_type(t));
  return `[${type_arr_in_str.join(", ")}]`;
}

export function is_equal_type(expected_type: Type, actual_type: Type): boolean {
  return stringify_type(actual_type) === stringify_type(expected_type);
}

// used by function type for now
export function is_equal_types(
  expected_types: Type[],
  actual_types: Type[],
  err_msg_if_expect_less_than_actual = "",
  err_msg_if_expect_more_than_actual = "",
): boolean {
  if (expected_types.length !== actual_types.length) {
    const errorMsg =
      expected_types.length < actual_types.length
        ? err_msg_if_expect_less_than_actual
        : err_msg_if_expect_more_than_actual;
    throw new TypeError(
      `${errorMsg}: have ${stringify_types(
        actual_types,
      )}, want ${stringify_types(expected_types)}`,
    );
  }

  return expected_types.every((expected_type, i) =>
    is_equal_type(expected_type, actual_types[i]),
  );
}

// ===========================================
// HELPER METHODS TO RECONSTRUCT TYPE OBJECTS
// ===========================================

export function make_undefined_type(): UndefinedType {
  return {
    _type: Types.UNDEFINED,
  };
}

export function make_literal_type(val: string): LiteralType {
  return {
    _type: Types.LITERAL,
    val,
  };
}

export function make_return_type(res: Type[]): ReturnType {
  return {
    _type: Types.RETURN,
    res,
  };
}

export function make_function_type(
  args: Type[],
  res: Type | Type[],
): FunctionType {
  return {
    _type: Types.FUNCTION,
    args,
    res,
  };
}

export function make_function_type_from_ast(astNode: AST.FuncDecl) {
  const param_types = astNode.Type.Params.List.flatMap((e) =>
    e.Names.map(() => make_literal_type(e.Type.Name)),
  );

  let declared_return_type: Type[] = [];
  if (astNode.Type.Results) {
    declared_return_type = astNode.Type.Results.List.flatMap((e) =>
      make_literal_type(e.Type.Name),
    );
  }

  return make_function_type(param_types, declared_return_type);
}
