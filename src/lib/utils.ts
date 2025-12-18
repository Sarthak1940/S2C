import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const combineSlug = (name: string, maxLen = 80): string => {
  const base = name;

  if (!base) return "untited"

  let s = base
          .normalize("NFKD")
          .replace(/\p{M}+/gu, "")
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9]/g, "")

  if (!s) return "untited"
  if (s.length > maxLen) s.slice(0, maxLen)

  return s
}
