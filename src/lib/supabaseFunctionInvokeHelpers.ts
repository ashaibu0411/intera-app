/**
 * Supabase functions.invoke returns a generic message on non-2xx; the real body lives on FunctionsHttpError.context (fetch Response).
 */
import { FunctionsHttpError } from '@supabase/supabase-js';

export type ParsedFunctionError = { message: string; httpStatus?: number };

export async function getMessageFromFunctionsInvokeError(error: unknown): Promise<ParsedFunctionError> {
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response | undefined;
    const httpStatus = res?.status;
    if (res) {
      try {
        const body = await res.clone().json();
        if (body && typeof body.error === 'string') {
          return { message: body.error, httpStatus };
        }
        if (body && typeof body.message === 'string') {
          return { message: body.message, httpStatus };
        }
        if (body && typeof body === 'object') {
          return { message: JSON.stringify(body), httpStatus };
        }
      } catch {
        try {
          const text = (await res.clone().text()).trim();
          if (text) {
            return { message: text.slice(0, 1000), httpStatus };
          }
        } catch {
          /* ignore */
        }
      }
    }
    return { message: error.message, httpStatus };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: String(error) };
}

export function formatFunctionsInvokeErrorForUser(parsed: ParsedFunctionError): string {
  const { message, httpStatus } = parsed;
  if (typeof httpStatus === 'number' && httpStatus >= 400) {
    return `${message} (HTTP ${httpStatus})`;
  }
  return message;
}
