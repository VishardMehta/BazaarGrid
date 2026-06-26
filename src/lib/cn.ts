/** Tiny classnames joiner — filters falsy values. No extra deps. */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
