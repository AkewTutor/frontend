import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge our custom @theme tokens (src/styles/globals.css).
// Without this, `text-m` / `text-s` are treated as text COLORS and get merged away
// against `text-ink`, `text-primary`, etc. Add any new custom token used with
// text-/rounded-/shadow- classes here.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['s', 'm', 'l', 'display', 'heading'] }],
      rounded: [{ rounded: ['s', 'm', 'pill'] }],
      shadow: [{ shadow: ['card', 'header'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
