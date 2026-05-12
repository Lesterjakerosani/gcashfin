import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function fmt(n: number): string {
  return Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const MSHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const ACCOUNT_COLORS = ["#c0392b","#e67e22","#f1c40f","#27ae60","#2980b9","#8e44ad","#888888"];
