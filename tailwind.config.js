/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0038A7",         // UX blå
        primaryLight: "#CBD1FF",    // UX blå-lav
        primaryLighter: "#E9ECFF",  // UX endnu lysere
        tertiary: "#B7C2E6",        // UX tertiary
        black: "#000000",
        white: "#FFFFFF",
        error: "#F11B1B",
      },

      // Bruges til timeline linjer og grid
      borderColor: {
        timeline: "#B7C2E6",
      },

      backgroundColor: {
        card: "#FFFFFF",
        surface: "#E9ECFF",
      },
      textColor: {
        main: "#000000",
      },
    },
  },
  plugins: [],
};
