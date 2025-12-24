// Supprime l'avertissement Tailwind CDN de la console
const originalWarn = console.warn;
console.warn = function(...args) {
  if (args[0] && args[0].includes && args[0].includes('cdn.tailwindcss.com')) {
    return; // Masquer l'avertissement Tailwind
  }
  originalWarn.apply(console, args);
};
