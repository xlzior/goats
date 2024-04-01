import { FunctionType, LiteralType, Type, Types } from "../types/typing";
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

const binary_string_type: FunctionType = make_function_type(
  [make_literal_type(DataType.STRING), make_literal_type(DataType.STRING)],
  make_literal_type(DataType.STRING),
);

const number_comparison_type: FunctionType = make_function_type(
  [make_literal_type(DataType.INT), make_literal_type(DataType.INT)],
  make_literal_type(DataType.BOOL),
);

const string_comparison_type: FunctionType = make_function_type(
  [make_literal_type(DataType.STRING), make_literal_type(DataType.STRING)],
  make_literal_type(DataType.BOOL),
);

const binary_bool_type: FunctionType = make_function_type(
  [make_literal_type(DataType.BOOL), make_literal_type(DataType.BOOL)],
  make_literal_type(DataType.BOOL),
);

const builtin_func_types: Record<string, Type | Type[]> = {
  Println: [
    make_function_type(
      [make_literal_type(DataType.STRING)],
      make_literal_type(DataType.STRING),
    ),
    make_function_type(
      [make_literal_type(DataType.INT)],
      make_literal_type(DataType.STRING),
    ),
  ],
  Sleep: make_function_type(
    [make_literal_type(DataType.INT)],
    make_literal_type(DataType.STRING),
  ),
};

// For functions with multiple function types, ensure that each type has the same args length
// Otherwise, error will be thrown at is_equal_types
export const global_type_frame: Record<string, Type | Type[]> = {
  "+": [binary_arith_type, binary_string_type],
  "-": [binary_arith_type],
  "*": binary_arith_type,
  "/": binary_arith_type,
  "%": binary_arith_type,
  "<": [number_comparison_type, string_comparison_type],
  ">": [number_comparison_type, string_comparison_type],
  "<=": [number_comparison_type, string_comparison_type],
  ">=": [number_comparison_type, string_comparison_type],
  "==": [number_comparison_type, string_comparison_type],
  "!=": [number_comparison_type, string_comparison_type],
  "&&": binary_bool_type,
  "||": binary_bool_type,
  "-unary": unary_arith_type,
  "!": unary_bool_type,
  ...builtin_func_types,
};

// ===========================================

/**
 * Converts a Type object to a String representation
 * Example: { _type: "Literal", val: "int"} -> "int"
 */
export function stringify_type(type: any): string {
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
export function stringify_types(type_arr: any[]): string {
  const type_arr_in_str = type_arr.map((t) => stringify_type(t));
  return `[${type_arr_in_str.join(", ")}]`;
}

// Used by function with multiple function types for now
// Example: [{ _type: "Function", args: [...], res: "..."}, { _type: "Function", args: [...], res: "..."}] -> ["int", "int"] or ["string"]
export function stringify_multiple_types(type_arr: any[]): string {
  const err_msg = type_arr.map((arr) => stringify_types(arr.args));
  return `${err_msg.join(" or ")}`;
}

export function is_equal_type(expected_type: any, actual_type: any): boolean {
  return stringify_type(actual_type) === stringify_type(expected_type);
}

// used by function type for now
export function is_equal_types(
  expected_types: Type[],
  actual_types: Type[],
): boolean {
  if (expected_types.length != actual_types.length)
    throw new TypeError(
      `Expected ${expected_types.length} type${
        expected_types.length > 1 ? "s" : ""
      }, but got ${actual_types.length} `,
    );
  return expected_types.every((expected_type, i) =>
    is_equal_type(expected_type, actual_types[i]),
  );
}

// ===========================================
// HELPER METHODS TO RECONSTRUCT TYPE OBJECTS
// ===========================================

export function make_literal_type(val: string): LiteralType {
  return {
    _type: Types.LITERAL,
    val,
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
