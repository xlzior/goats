import { TypeError } from "../errors";
import * as AST from "../types/ast";
import { DataType } from "../types/data_type";
import { FunctionType, ReturnType, Type, Types } from "../types/typing";
import { pluralize } from "../utils";
import {
  ANY_TYPE,
  BOOL_TYPE,
  INT_TYPE,
  MUTEX_TYPE,
  UNDEFINED_TYPE,
  WAITGROUP_TYPE,
  make_function_type,
} from "./objects";

export function make_union_type(types: Type[]): Type {
  if (types.length === 0) return UNDEFINED_TYPE;

  const deduped_types: Type[] = [];
  for (const type of types) {
    const exists = deduped_types.some((x) => is_equal_type(type, x));
    if (!exists) deduped_types.push(type);
  }
  if (deduped_types.length === 1) return types[0];

  return { _type: Types.UNION, types: deduped_types };
}

export function type_union(type1: Type, type2: Type): Type {
  if (is_equal_type(type1, type2)) return type1;

  const types_in_1 = type1._type === Types.UNION ? type1.types : [type1];
  const types_in_2 = type2._type === Types.UNION ? type2.types : [type2];

  return make_union_type([...types_in_1, ...types_in_2]);
}

const unary_arith_type: FunctionType = make_function_type(
  [INT_TYPE],
  [INT_TYPE],
);

const unary_bool_type: FunctionType = make_function_type(
  [BOOL_TYPE],
  [BOOL_TYPE],
);

const binary_arith_type: FunctionType = make_function_type(
  [INT_TYPE, INT_TYPE],
  [INT_TYPE],
);

const binary_bool_type: FunctionType = make_function_type(
  [BOOL_TYPE, BOOL_TYPE],
  [BOOL_TYPE],
);

const builtin_func_types: Record<string, Type> = {
  Println: make_function_type([ANY_TYPE], [UNDEFINED_TYPE]),
  Sleep: make_function_type([INT_TYPE], [UNDEFINED_TYPE]),
  PrintHeap: make_function_type([], [UNDEFINED_TYPE]),
  PrintEnvironment: make_function_type([], [UNDEFINED_TYPE]),
  PrintRuntimeStack: make_function_type([], [UNDEFINED_TYPE]),
  Lock: make_function_type([MUTEX_TYPE], [UNDEFINED_TYPE]),
  Unlock: make_function_type([MUTEX_TYPE], [UNDEFINED_TYPE]),
  Add: make_function_type([WAITGROUP_TYPE, INT_TYPE], [UNDEFINED_TYPE]),
  Wait: make_function_type([WAITGROUP_TYPE], [UNDEFINED_TYPE]),
  Done: make_function_type([WAITGROUP_TYPE], [UNDEFINED_TYPE]),
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
 * Special operators are +, >, >=, <, <=, ==, !=
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
  if (op === AST.Token.ADD) return left_operand_type; // for add operator
  return BOOL_TYPE; // for comparison operators
}

/**
 * Converts a Type object to a String representation
 * Example: { _type: "Literal", val: "int"} -> "int"
 */
export function stringify_type(type: Type): string {
  switch (type._type) {
    case Types.UNDEFINED:
      return "undefined";
    case Types.LITERAL:
      return type.val;
    case Types.RETURN:
      return stringify_types(type.res);
    case Types.UNION:
      return `(${Array.from(type.types).join(" | ")})`;
    case Types.CHANNEL:
      return `chan ${stringify_type(type.val)}`;
    case Types.ANY:
      return "any";
    case Types.MUTEX:
      return "Mutex";
    case Types.WAITGROUP:
      return "WaitGroup";
    case Types.FUNCTION:
      return `(${stringify_types(type.args)}) -> ${stringify_types(type.res)}`;
    default:
      throw new TypeError(`Cannot stringify type ${type}`);
  }
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
  if (expected_type._type === Types.ANY) return true;
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

export function check_return_type(
  func_name: string,
  actual_result_type: Type,
  declared_return_type: Type[],
) {
  if (
    actual_result_type._type === Types.RETURN &&
    !is_equal_types(
      declared_return_type,
      (actual_result_type as ReturnType).res,
      `${func_name}: too many return values`,
      `${func_name}: not enough return values`,
    )
  ) {
    throw new TypeError(
      `${func_name}: cannot use ${stringify_types(
        (actual_result_type as ReturnType).res,
      )} as ${stringify_types(declared_return_type)} value in return statement`,
    );
  }
}

/**
 * Used by var decl and assign stmts to compare lhs and rhs types
 * It will terminate whenever any one type fails to match
 */
export function check_lhs_rhs_types(
  lhs_types: Type[],
  rhs_types: Type[],
  stmt: string,
) {
  for (let i = 0; i < lhs_types.length; i++) {
    if (!is_equal_type(lhs_types[i], rhs_types[i])) {
      throw new TypeError(
        `cannot use ${stringify_type(rhs_types[i])} as ${stringify_type(
          lhs_types[i],
        )} value in ${stmt}`,
      );
    }
  }
}

/**
 * Used by var decl and assign stmts to compare length on lhs and rhs
 */
export function check_lhs_rhs_equal_length(lhs: number, rhs: number) {
  if (lhs != rhs) {
    throw new TypeError(
      `assignment mismatch: ${lhs} ${pluralize(
        "variable",
        lhs,
      )} but ${rhs} ${pluralize("value", rhs)}`,
    );
  }
}
