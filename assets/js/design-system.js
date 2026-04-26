/**
 * 🎨 DESIGN SYSTEM - Tokens & Utilities
 * Centralized design tokens for consistent styling
 */

export const theme = {
  // ✨ Brand Colors (Futuristic Palette)
  colors: {
    // Primaries
    primary: '#6366f1',      // Indigo - Main brand
    primaryLight: '#818cf8',
    primaryDark: '#4f46e5',

    // Accents
    accent: '#a855f7',       // Purple - Secondary
    accentLight: '#c084fc',
    accentDark: '#9333ea',

    // Success/Green
    success: '#10b981',
    successLight: '#6ee7b7',
    successDark: '#059669',

    // Warning/Amber
    warning: '#f59e0b',
    warningLight: '#fcd34d',
    warningDark: '#d97706',

    // Error/Red
    error: '#ef4444',
    errorLight: '#fca5a5',
    errorDark: '#dc2626',

    // Info/Blue
    info: '#0ea5e9',
    infoLight: '#7dd3fc',
    infoDark: '#0284c7',

    // Grays
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },

    // Dark theme
    dark: {
      bg: '#050505',
      bgAlt: '#0f1115',
      surface: '#1e1f22',
      surfaceAlt: '#2b2d31',
      border: '#3f4147',
      text: '#ffffff',
      textMuted: '#9ca3af',
    },

    // Gradients
    gradients: {
      primary: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      secondary: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
      danger: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
      success: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    }
  },

  // 📏 Spacing System (8px base)
  spacing: {
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
  },

  // 🔤 Typography
  typography: {
    fontFamily: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: 'Fira Code, SFMono-Regular, Monaco, Consolas, monospace',
      display: 'Space Grotesk, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    fontSize: {
      xs: { size: '0.75rem', height: '1rem' },           // 12px
      sm: { size: '0.875rem', height: '1.25rem' },       // 14px
      base: { size: '1rem', height: '1.5rem' },          // 16px
      lg: { size: '1.125rem', height: '1.75rem' },       // 18px
      xl: { size: '1.25rem', height: '1.75rem' },        // 20px
      '2xl': { size: '1.5rem', height: '2rem' },         // 24px
      '3xl': { size: '1.875rem', height: '2.25rem' },    // 30px
      '4xl': { size: '2.25rem', height: '2.5rem' },      // 36px
      '5xl': { size: '3rem', height: '1' },              // 48px
      '6xl': { size: '3.75rem', height: '1' },           // 60px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    }
  },

  // 🎭 Shadows
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.08)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    glow: '0 0 20px rgba(99, 102, 241, 0.3)',
    glowLg: '0 0 40px rgba(99, 102, 241, 0.5)',
  },

  // 📐 Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // ✨ Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // 🎬 Animations
  animations: {
    spin: 'spin 1s linear infinite',
    ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    bounce: 'bounce 1s infinite',
    float: 'float 3s ease-in-out infinite',
    slideIn: 'slideIn 0.3s ease-out',
    fadeIn: 'fadeIn 0.3s ease-in',
  },

  // 🔨 Utilities
  minWidth: { 'prose': '65ch' },
  maxWidth: {
    sm: '24rem',
    md: '28rem',
    lg: '32rem',
    xl: '36rem',
    '2xl': '42rem',
    '3xl': '48rem',
    '4xl': '56rem',
  }
};

// 🎨 Utility functions
export const createClassName = (baseClass, modifiers = {}) => {
  const classes = [baseClass];
  Object.entries(modifiers).forEach(([key, value]) => {
    if (value) classes.push(`${baseClass}--${key}`);
  });
  return classes.join(' ');
};

export const getCSSVariable = (variable) => {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
};

export const setCSSVariable = (variable, value) => {
  document.documentElement.style.setProperty(variable, value);
};

// 🌈 Color utilities
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToString = (rgb, alpha = 1) => {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

// 💾 Theme persistence
export const persistTheme = (themeName) => {
  localStorage.setItem('theme-preference', themeName);
  document.documentElement.setAttribute('data-theme', themeName);
};

export const loadTheme = () => {
  const saved = localStorage.getItem('theme-preference') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  return saved;
};

export default theme;
