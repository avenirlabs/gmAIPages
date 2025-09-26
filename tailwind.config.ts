import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        sm: "var(--container-sm)",
        md: "var(--container-md)",
        lg: "var(--container-lg)",
        xl: "var(--container-xl)",
        "2xl": "var(--container-2xl)",
      },
    },
    extend: {
      /* ========================================
         BRAND COLOR SYSTEM
         ======================================== */
      colors: {
        /* Brand Colors */
        brand: {
          primary: {
            50: "hsl(var(--brand-primary-50))",
            100: "hsl(var(--brand-primary-100))",
            200: "hsl(var(--brand-primary-200))",
            300: "hsl(var(--brand-primary-300))",
            400: "hsl(var(--brand-primary-400))",
            500: "hsl(var(--brand-primary-500))", // Main brand color
            600: "hsl(var(--brand-primary-600))",
            700: "hsl(var(--brand-primary-700))",
            800: "hsl(var(--brand-primary-800))",
            900: "hsl(var(--brand-primary-900))",
            DEFAULT: "hsl(var(--brand-primary-500))",
          },
          secondary: {
            50: "hsl(var(--brand-secondary-50))",
            100: "hsl(var(--brand-secondary-100))",
            200: "hsl(var(--brand-secondary-200))",
            300: "hsl(var(--brand-secondary-300))",
            400: "hsl(var(--brand-secondary-400))",
            500: "hsl(var(--brand-secondary-500))",
            600: "hsl(var(--brand-secondary-600))",
            700: "hsl(var(--brand-secondary-700))", // Main secondary color
            800: "hsl(var(--brand-secondary-800))",
            900: "hsl(var(--brand-secondary-900))",
            DEFAULT: "hsl(var(--brand-secondary-700))",
          },
          accent: {
            50: "hsl(var(--brand-accent-50))",
            100: "hsl(var(--brand-accent-100))",
            200: "hsl(var(--brand-accent-200))", // Main accent color
            300: "hsl(var(--brand-accent-300))",
            400: "hsl(var(--brand-accent-400))",
            500: "hsl(var(--brand-accent-500))",
            DEFAULT: "hsl(var(--brand-accent-200))",
          },
        },

        /* Neutral Scale */
        neutral: {
          0: "hsl(var(--neutral-0))",
          50: "hsl(var(--neutral-50))",
          100: "hsl(var(--neutral-100))",
          200: "hsl(var(--neutral-200))",
          300: "hsl(var(--neutral-300))",
          400: "hsl(var(--neutral-400))",
          500: "hsl(var(--neutral-500))",
          600: "hsl(var(--neutral-600))",
          700: "hsl(var(--neutral-700))",
          800: "hsl(var(--neutral-800))",
          900: "hsl(var(--neutral-900))",
          950: "hsl(var(--neutral-950))",
        },

        /* Semantic Colors */
        success: {
          DEFAULT: "hsl(var(--success))",
          light: "hsl(var(--success-light))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          light: "hsl(var(--warning-light))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          light: "hsl(var(--error-light))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          light: "hsl(var(--info-light))",
        },

        /* Shadcn Compatibility - maps to brand tokens */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },

      /* ========================================
         TYPOGRAPHY SYSTEM
         ======================================== */
      fontSize: {
        xs: ["var(--text-xs)", { lineHeight: "var(--leading-normal)" }],
        sm: ["var(--text-sm)", { lineHeight: "var(--leading-normal)" }],
        base: ["var(--text-base)", { lineHeight: "var(--leading-normal)" }],
        lg: ["var(--text-lg)", { lineHeight: "var(--leading-relaxed)" }],
        xl: ["var(--text-xl)", { lineHeight: "var(--leading-relaxed)" }],
        "2xl": ["var(--text-2xl)", { lineHeight: "var(--leading-tight)" }],
        "3xl": ["var(--text-3xl)", { lineHeight: "var(--leading-tight)" }],
        "4xl": ["var(--text-4xl)", { lineHeight: "var(--leading-tight)" }],
        "5xl": ["var(--text-5xl)", { lineHeight: "var(--leading-tight)" }],
        "6xl": ["var(--text-6xl)", { lineHeight: "var(--leading-tight)" }],
        "7xl": ["var(--text-7xl)", { lineHeight: "var(--leading-tight)" }],
      },

      fontFamily: {
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },

      fontWeight: {
        light: "var(--font-light)",
        normal: "var(--font-normal)",
        medium: "var(--font-medium)",
        semibold: "var(--font-semibold)",
        bold: "var(--font-bold)",
        extrabold: "var(--font-extrabold)",
      },

      lineHeight: {
        tight: "var(--leading-tight)",
        snug: "var(--leading-snug)",
        normal: "var(--leading-normal)",
        relaxed: "var(--leading-relaxed)",
        loose: "var(--leading-loose)",
      },

      /* ========================================
         SPACING & LAYOUT
         ======================================== */
      spacing: {
        px: "var(--space-px)",
        0: "var(--space-0)",
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        16: "var(--space-16)",
        20: "var(--space-20)",
        24: "var(--space-24)",
        32: "var(--space-32)",
        40: "var(--space-40)",
        48: "var(--space-48)",
        56: "var(--space-56)",
        64: "var(--space-64)",
      },

      /* ========================================
         BORDER RADIUS
         ======================================== */
      borderRadius: {
        none: "var(--radius-none)",
        sm: "var(--radius-sm)",
        base: "var(--radius-base)",
        DEFAULT: "var(--radius-base)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full: "var(--radius-full)",
      },

      /* ========================================
         BOX SHADOWS
         ======================================== */
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-base)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        inner: "var(--shadow-inner)",
        primary: "var(--shadow-primary)",
        "primary-lg": "var(--shadow-primary-lg)",
      },

      /* ========================================
         Z-INDEX SCALE
         ======================================== */
      zIndex: {
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        fixed: "var(--z-fixed)",
        "modal-backdrop": "var(--z-modal-backdrop)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        tooltip: "var(--z-tooltip)",
        toast: "var(--z-toast)",
      },

      /* ========================================
         ANIMATIONS
         ======================================== */
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-in-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-out-down": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
        "fade-out": "fade-out 0.15s ease-out",
        "slide-in-up": "slide-in-up 0.2s ease-out",
        "slide-out-down": "slide-out-down 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/aspect-ratio")],
} satisfies Config;
