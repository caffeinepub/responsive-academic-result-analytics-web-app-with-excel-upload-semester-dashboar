export function assertDefined<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

export function assertNonEmpty<T>(array: T[], message: string): asserts array is [T, ...T[]] {
  if (array.length === 0) {
    throw new Error(message);
  }
}

export function isValidNumber(value: number): boolean {
  return isFinite(value) && !isNaN(value);
}
