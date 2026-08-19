export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  if (!value.trim()) return true; // phone is optional in most forms
  return /^[+\d][\d\s-]{6,20}$/.test(value.trim());
}

export function required(value: string): boolean {
  return value.trim().length > 0;
}
