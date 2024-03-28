import { Result } from '..'
import GolangRunner from 'go-slang'
import { BuiltinFunction } from 'go-slang/src/types';
import { Context } from '..';
import { resolvedErrorPromise } from './utils';
import { GoError } from '../errors/goErrors';

const fallbackErrorMsg = "Some error occurred while running Go program. Please try again later."

/**
 * Wrapper for GolangRunner from go-slang
 */
export async function golangRunner(
  code: string,
  context: Context,
): Promise<Result> {

  const builtin_mapping: Record<string, BuiltinFunction> = {
    Println: {
      arity: 1,
      apply: context.nativeStorage.builtins.get('Println')
    },
  };

  try {
    const runner = new GolangRunner(builtin_mapping)
    const result = await runner.execute(code)
    return {
      status: 'finished',
      context: context,
      value: result.value
    }
  } catch (error: any) {
    context.errors.push(new GoError(error.toString() ?? fallbackErrorMsg))
    return resolvedErrorPromise
  }

}
