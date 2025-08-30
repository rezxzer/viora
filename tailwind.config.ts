import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', 'media'],
  content: [
    './src/app/**/*.{ts,tsx,mdx}',
    './src/components/**/*.{ts,tsx,mdx}',
    './src/ui/**/*.{ts,tsx,mdx}',
    './src/lib/**/*.{ts,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        foreground: 'var(--foreground)',
        surface: 'var(--color-surface)',
        elev: 'var(--color-elev)',
        border: 'var(--color-border)',
        primary: 'var(--color-primary)',
        'primary-foreground': 'var(--color-primary-foreground)',
        muted: 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-foreground)',
        primaryFg: 'var(--primary-fg)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      boxShadow: {
        soft: '0 1px 1px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.06)',
      },
      ringColor: {
        DEFAULT: 'var(--ring)',
      },
    },
  },
  plugins: [],
}

export default config
