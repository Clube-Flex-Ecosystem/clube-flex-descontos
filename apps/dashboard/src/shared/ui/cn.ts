import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Combina classes condicionais e resolve utilidades Tailwind conflitantes. */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
