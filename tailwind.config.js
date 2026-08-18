const config = {
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
        // Dyp havblå - hovedfargen
        hav: {
          50: "#F1F5F9",
          100: "#DEE9F2",
          200: "#BDD3E6",
          300: "#8FB4D2",
          400: "#5C8FB8",
          500: "#3E739E",
          600: "#336089",
          700: "#294D6D",
          800: "#213C55",
          900: "#17293A",
        },
        // Varm nøytral - bakgrunn og tekst
        sand: {
          50: "#FAFAF7",
          100: "#F3F3EE",
          200: "#E7E7DF",
          300: "#D4D5C9",
          400: "#A9AB9C",
          500: "#7C7F70",
          600: "#5C5F53",
          700: "#454840",
          800: "#2E302B",
          900: "#1B1C19",
        },
        // Semantiske farger til quiz-tilbakemelding
        riktig: {
          bg: "#E6F0E8",
          kant: "#4A8759",
          tekst: "#26502F",
        },
        galt: {
          bg: "#F6E6E4",
          kant: "#B0564C",
          tekst: "#7A2F27",
        },
      },
    },
  },
  plugins: [],
};

module.exports = config;
