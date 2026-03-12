import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function generateTitle(input: string): string {
  const cleaned = input.replace(/\n/g, " ").trim();
  return truncate(cleaned, 50) || "New Chat";
}
