const config = {
  content: ["./app/**/*.{js,jsx,mdx}", "./components/**/*.{js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#E0000B", dark: "#B80009", soft: "#FFF0F0" },
        ink: { DEFAULT: "#171719", muted: "#68686F", subtle: "#929299" },
        surface: { DEFAULT: "#FFFFFF", canvas: "#F7F7F8", raised: "#FCFCFD" },
        line: { DEFAULT: "#E7E7EA", strong: "#D7D7DC" },
        success: { DEFAULT: "#16834A", soft: "#EAF7EF" },
        warning: { DEFAULT: "#A96200", soft: "#FFF5E5" },
        error: { DEFAULT: "#9E3B58", soft: "#FBECEF" },
      },
      borderRadius: {
        sm: "var(--radius-sm)", DEFAULT: "var(--radius-md)",
        lg: "var(--radius-lg)", xl: "var(--radius-xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)", md: "var(--shadow-md)", lg: "var(--shadow-lg)",
      },
      spacing: { 4.5: "1.125rem", 5.5: "1.375rem", 18: "4.5rem", 22: "5.5rem" },
      fontFamily: { sans: ["var(--font-app)", "Arial", "sans-serif"] },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      },
    },
  },
};

module.exports = config;
