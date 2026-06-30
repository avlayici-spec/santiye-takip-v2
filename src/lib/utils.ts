import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, showDecimals: boolean = false) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  
  const hasLeadingZero = digits.startsWith("0");
  const rawNum = hasLeadingZero ? digits.substring(1) : digits;
  
  let formatted = "";
  if (hasLeadingZero) {
    formatted += "0 ";
  }
  
  if (rawNum.length > 0) {
    const part1 = rawNum.substring(0, 3);
    formatted += `(${part1}`;
    if (rawNum.length > 3) {
      formatted += `) `;
      const part2 = rawNum.substring(3, 6);
      formatted += part2;
      if (rawNum.length > 6) {
        formatted += ` `;
        const part3 = rawNum.substring(6, 8);
        formatted += part3;
        if (rawNum.length > 8) {
          formatted += ` `;
          const part4 = rawNum.substring(8, 10);
          formatted += part4;
        }
      }
    }
  }
  return formatted;
}

export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 0 || digits.length === 10 || digits.length === 11;
}
