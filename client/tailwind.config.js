module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // Incluye todas las rutas relevantes
  ],
  theme: {
    extend: {
      colors: {
        border: "#e5e7eb", // Define el color para `border-border`
        background: "#f9fafb", // Define el color para `bg-background`
        foreground: "#111827", // Define el color para `text-foreground`
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"], // Define la fuente para `font-sans`
      },
    },
  },
  plugins: [],
};