import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function splitSteps(steps: string) {
  return steps.split(";").map((s) => s.trim()).filter(Boolean);
}
