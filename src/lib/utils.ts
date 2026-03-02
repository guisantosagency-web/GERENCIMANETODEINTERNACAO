import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(birthDate: string): string {
  if (!birthDate) return ""

  // Support both DD/MM/YYYY and DD.MM.YYYY formats
  const parts = birthDate.split(/[/.]/)
  if (parts.length !== 3) return ""

  const day = Number.parseInt(parts[0], 10)
  const month = Number.parseInt(parts[1], 10) - 1 // Month is 0-indexed in Date
  const year = Number.parseInt(parts[2], 10)

  // Handle 2-digit years (assume 2000s for 00-50, 1900s for 51-99)
  let fullYear = year
  if (year < 100) {
    fullYear = year <= 50 ? 2000 + year : 1900 + year
  }

  if (isNaN(day) || isNaN(month) || isNaN(fullYear)) return ""

  const birth = new Date(fullYear, month, day)
  const today = new Date()

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  // Adjust age if birthday hasn't occurred this year yet
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age >= 0 ? `${age} ANOS` : ""
}
