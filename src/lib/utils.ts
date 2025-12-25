import { Point } from "@/redux/slice/viewport";
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

export const polylineBox = (
  points: ReadonlyArray<Point>
) => {

  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const point of points) {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}
