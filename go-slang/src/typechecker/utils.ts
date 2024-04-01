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

// Type frames are JavaScript objects that map
// symbols (strings) to types.
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
 */
export function stringify_type(type: any): string {
  if (type._type === Types.LITERAL) {
    return type.val;
  }
  throw new TypeError("Type does not exist");
}

/**
 * Converts an array of Type object to a String representation
 * @returns String enclosed by square brackets
 */
export function stringify_types(type_arr: any[]): string {
  const type_arr_in_str = type_arr.map((t) => stringify_type(t));
  return `[${type_arr_in_str.join(", ")}]`;
}

// Used by function with multiple function types
export function stringify_multiple_types(type_arr: any[]): string {
  const err_msg = type_arr.map((arr) => stringify_types(arr.args));
  return `${err_msg.join(" or ")}`;
}

export function is_equal_type(type1: any, type2: any): boolean {
  return stringify_type(type1) === stringify_type(type2);
}

// used by function type for now
export function is_equal_types(type_arr1: Type[], type_arr2: Type[]): boolean {
  for (let i = 0; i < type_arr1.length; i++) {
    if (!is_equal_type(type_arr1[i], type_arr2[i])) return false;
  }
  return true;
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
