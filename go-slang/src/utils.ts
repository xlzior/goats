export const is_number = (val: any) => typeof val === "number";

export const is_string = (val: any) => typeof val === "string";

export const is_boolean = (val: any) => typeof val === "boolean";

export function peek<T>(stack: Array<T>, index: number = 0) {
  if (stack.length === 0) throw new Error("Stack is empty!");
  return stack[stack.length - 1 - index];
}
