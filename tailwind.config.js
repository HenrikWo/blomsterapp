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
        // Skogsgrønn - hovedfargen
        skog: {
          50: "#F2F7F3",
          100: "#E1EDE5",
          200: "#C3DACB",
          300: "#9BC1A9",
          400: "#6BA283",
          500: "#4C8865",
          600: "#40795A",
          700: "#346249",
          800: "#294C39",
          900: "#1C3427",
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
        // Dempet blå til Wikipedia-lenker
        arkiv: {
          600: "#33566F",
          700: "#284457",
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
