import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 16px on phones, where iOS zooms into any field set smaller (brandc's text-base is 15px); 14px from md up. */
export const FIELD_TEXT = "text-[16px] md:text-sm"
