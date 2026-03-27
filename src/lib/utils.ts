import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function getStreakHeatmap(days: Array<{ date: string; count: number }>) {
  const map = new Map(days.map((item) => [item.date, item.count]));
  const today = new Date();
  const output: Array<{ date: string; count: number }> = [];

  for (let i = 41; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    output.push({ date: key, count: map.get(key) ?? 0 });
  }

  return output;
}

export function getModeLabel(mode: string) {
  switch (mode) {
    case "PART_1":
      return "Part 1";
    case "PART_2":
      return "Part 2";
    case "PART_3":
      return "Part 3";
    default:
      return "Thi thử";
  }
}
