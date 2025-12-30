/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");

module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.tsx", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  corePlugins: {
    space: false,
  },
  theme: {
    // NOTE to AI: You can extend the theme with custom colors or styles here.
    extend: {
      colors: {
        terracotta: {
          50: "#FDF5F2",
          100: "#FAEAE3",
          200: "#F4D0C3",
          300: "#EBB19C",
          400: "#E08B6D",
          500: "#D4673A",
          600: "#B85430",
          700: "#974327",
          800: "#7A371F",
          900: "#652E1A",
        },
        forest: {
          50: "#F0F7F5",
          100: "#DCF0EA",
          200: "#B9E0D5",
          300: "#8DCAB8",
          400: "#5AAD95",
          500: "#3A8F76",
          600: "#2D725E",
          700: "#1B4D3E",
          800: "#153D31",
          900: "#102E25",
        },
        gold: {
          50: "#FDFAF0",
          100: "#FBF4D9",
          200: "#F6E8AF",
          300: "#EFDA7D",
          400: "#E5C64A",
          500: "#C9A227",
          600: "#A6841F",
          700: "#836618",
          800: "#6A5213",
          900: "#56430F",
        },
        cream: "#FAF7F2",
        warmBrown: "#2D1F1A",
      },
      fontSize: {
        xs: "10px",
        sm: "12px",
        base: "14px",
        lg: "18px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        "4xl": "40px",
        "5xl": "48px",
        "6xl": "56px",
        "7xl": "64px",
        "8xl": "72px",
        "9xl": "80px",
      },
    },
  },
  darkMode: "class",
  plugins: [
    plugin(({ matchUtilities, theme }) => {
      const spacing = theme("spacing");

      // space-{n}  ->  gap: {n}
      matchUtilities(
        { space: (value) => ({ gap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );

      // space-x-{n}  ->  column-gap: {n}
      matchUtilities(
        { "space-x": (value) => ({ columnGap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );

      // space-y-{n}  ->  row-gap: {n}
      matchUtilities(
        { "space-y": (value) => ({ rowGap: value }) },
        { values: spacing, type: ["length", "number", "percentage"] }
      );
    }),
  ],
};

