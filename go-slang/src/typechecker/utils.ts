import * as AST from "../types/ast";
import {
  FunctionType,
  LiteralType,
  ReturnType,
  TupleType,
  Type,
  Types,
  UndefinedType,
} from "../types/typing";
import { DataType } from "../types";
import { TypeError } from "../errors";

const unary_arith_type: FunctionType = make_function_type(
  [make_literal_type(DataType.INT)],
  make_literal_type(DataType.INT)
);

const unary_bool_type: FunctionType = make_function_type(
  [make_literal_type(DataType.BOOL)],
  make_literal_type(DataType.BOOL)
);

const binary_arith_type: FunctionType = make_function_type(
  [make_literal_type(DataType.INT), make_literal_type(DataType.INT)],
  make_literal_type(DataType.INT)
);

const binary_bool_type: FunctionType = make_function_type(
  [make_literal_type(DataType.BOOL), make_literal_type(DataType.BOOL)],
  make_literal_type(DataType.BOOL)
);

// TODO: Handle builtin function typechecking separately?
const builtin_func_types: Record<string, Type> = {
  Println: make_function_type(
    [make_literal_type(DataType.STRING)],
    make_literal_type(DataType.STRING)
  ),
  Sleep: make_function_type(
    [make_literal_type(DataType.INT)],
    make_literal_type(DataType.STRING)
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
  right_operand_type: any
) {
  if (
    left_operand_type.val === DataType.BOOL ||
    right_operand_type.val === DataType.BOOL ||
    !is_equal_type(left_operand_type, right_operand_type)
  ) {
    throw new TypeError(
      `${op} expects [int, int] or [string, string], but got [${stringify_types(
        [left_operand_type, right_operand_type]
      )}]`
    );
  }
  return left_operand_type;
}

/**
 * Converts a Type object to a String representation
 * Example: { _type: "Literal", val: "int"} -> "int"
 */
export function stringify_type(type: Type): string {
  if (type._type === Types.UNDEFINED) return "undefined";

  if (type._type === Types.LITERAL) return type.val;

  if (type._type === Types.RETURN) return `[${stringify_type(type.res)}]`;

  if (type._type === Types.TUPLE) return stringify_types(type.res);

  throw new TypeError("Type does not exist");
}

/**
 * Converts an array of Type object to a String representation
 * Example: [{ _type: "Literal", val: "int"}, { _type: "Literal", val: "string"}] -> ["int", "string"]
 *
 * @returns String enclosed by square brackets
 */
export function stringify_types(type_arr: Type[]): string {
  return type_arr.map((t) => stringify_type(t)).join(", ");
}

export function is_equal_type(expected_type: Type, actual_type: Type): boolean {
  return stringify_type(actual_type) === stringify_type(expected_type);
}

export function compare_tuple_types(expected: TupleType, actual: TupleType) {
  const actual_string = stringify_type(actual);
  const expected_string = stringify_type(expected);
  if (expected.res.length < actual.res.length) {
    throw new TypeError(
      `too many return values: have ${actual_string}, want ${expected_string}`
    );
  }
  if (expected.res.length > actual.res.length) {
    throw new TypeError(
      `not enough return values: have ${actual_string}, want ${expected_string}`
    );
  }
  if (!is_equal_types(expected.res, actual.res)) {
    throw new TypeError(
      `cannot use ${actual_string} as ${expected_string} value in return statement`
    );
  }
}

function is_undefined_return(type: Type): boolean {
  return (
    type._type === Types.UNDEFINED ||
    (type._type === Types.RETURN && type.res._type === Types.UNDEFINED)
  );
}

function is_single_return(type: Type): boolean {
  return type._type === Types.RETURN && type.res._type === Types.LITERAL;
}

function is_multiple_return(type: Type): boolean {
  return type._type === Types.RETURN && type.res._type === Types.TUPLE;
}

export function compare_return_types(
  func_name: string,
  expected: Type,
  actual: Type
) {
  if (expected._type === Types.UNDEFINED && !is_undefined_return(actual)) {
    throw new TypeError(
      `too many return values: have ${stringify_type(actual)}, want []`
    );
  }

  if (expected._type !== Types.UNDEFINED && is_undefined_return(actual)) {
    throw new TypeError(`${func_name}: missing return`);
  }

  if (expected._type === Types.LITERAL && is_single_return(actual)) {
    actual = actual as ReturnType;
    if (!is_equal_type(expected, actual.res)) {
      throw new TypeError(
        `${func_name}: cannot use ${stringify_type(
          actual
        )} as [${stringify_type(expected)}] value in return statement`
      );
    }
  }

  if (expected._type === Types.TUPLE && is_multiple_return(actual)) {
    return compare_tuple_types(expected as TupleType, actual as TupleType);
  }

  if (expected._type === Types.LITERAL && is_multiple_return(actual)) {
    throw new TypeError(
      `too many return values: have ${stringify_type(
        actual
      )}, want [${stringify_type(expected)}]`
    );
  }

  if (expected._type === Types.TUPLE && is_single_return(actual)) {
    throw new TypeError(
      `not enough return values: have ${stringify_type(
        actual
      )}, want [${stringify_type(expected)}]`
    );
  }
}

// used by function type for now
export function is_equal_types(
  expected_types: Type[],
  actual_types: Type[],
  err_msg_if_expect_less_than_actual = "",
  err_msg_if_expect_more_than_actual = ""
): boolean {
  if (expected_types.length !== actual_types.length) {
    const errorMsg =
      expected_types.length < actual_types.length
        ? err_msg_if_expect_less_than_actual
        : err_msg_if_expect_more_than_actual;
    throw new TypeError(
      `${errorMsg}: have ${stringify_types(
        actual_types
      )}, want ${stringify_types(expected_types)}`
    );
  }

  return expected_types.every((expected_type, i) =>
    is_equal_type(expected_type, actual_types[i])
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

function return_list_to_type(return_list: Type[]): Type {
  if (return_list.length === 0) return make_undefined_type();
  if (return_list.length === 1) return return_list[0];
  return make_tuple_type(return_list);
}

export function make_return_type(return_list: Type[]): ReturnType {
  const res = return_list_to_type(return_list);
  return { _type: Types.RETURN, res };
}

export function make_function_type(args: Type[], res: Type): FunctionType {
  return { _type: Types.FUNCTION, args, res };
}

export function make_tuple_type(res: Type[]): TupleType {
  return { _type: Types.TUPLE, res };
}

export function make_function_type_from_ast(astNode: AST.FuncDecl) {
  const param_types = astNode.Type.Params.List.flatMap((e) =>
    e.Names.map(() => make_literal_type(e.Type.Name))
  );

  const return_list =
    astNode.Type.Results?.List.map((e) => make_literal_type(e.Type.Name)) ?? [];

  const return_type = return_list_to_type(return_list);

  return make_function_type(param_types, return_type);
}
