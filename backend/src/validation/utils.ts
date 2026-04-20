import { ZodError } from 'zod';

export function getValidationMessage(error: ZodError, fallback: string): string {
  return error.issues[0]?.message ?? fallback;
}

export function getValidationErrors(error: ZodError) {
  return error.flatten();
}
