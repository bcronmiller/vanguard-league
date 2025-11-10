import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Manassas BJJ Brand Colors
        'mbjj-red': '#da2127',
        'mbjj-dark': '#191919',
        'mbjj-blue': '#0055a5',
        'mbjj-accent': {
          DEFAULT: '#da2127',
          hover: '#b71c22',
          light: '#ff4d53',
        },
      },
      fontFamily: {
        'heading': ['Oswald', 'sans-serif'],
        'body': ['Quattrocento Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
