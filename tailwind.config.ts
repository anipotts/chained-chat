/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"SF Mono"', "Menlo", "monospace"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      colors: {
        cc: {
          bg: "#0a0a0a",
          surface: "#141414",
          border: "#262626",
          "border-hover": "#3a3a3a",
          text: "#e5e5e5",
          "text-muted": "#737373",
          "text-dim": "#525252",
          accent: "#d4a574",
          "accent-dim": "#a67c52",
          green: "#4ade80",
          red: "#f87171",
          blue: "#60a5fa",
          amber: "#fbbf24",
        },
      },
      keyframes: {
        blink: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0.3" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        blink: "blink 1s infinite",
        "fade-in": "fade-in 0.2s ease-out",
        "pulse-slow": "pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        ".scrollbar-thin": { "scrollbar-width": "thin" },
        ".scrollbar-none": {
          "scrollbar-width": "none",
          "-ms-overflow-style": "none",
          "&::-webkit-scrollbar": { display: "none" },
        },
      });
    },
  ],
};
