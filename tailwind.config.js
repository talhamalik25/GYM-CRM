// Values live in app/tokens.css. This bridge preserves existing utility names.
const token = (name) => `var(--${name})`;
const sizes = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"];
const spacing = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24];
const statuses = ["active", "expired", "pending", "paid", "overdue", "present", "absent", "inactive", "partial", "expiring", "upcoming", "cancelled"];
const semanticColor = (name) => ({ DEFAULT: token(name), soft: token(`${name}-soft`) });

const config = {
  content: ["./app/**/*.{js,jsx,mdx}", "./components/**/*.{js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        white: token("white"),
        black: token("black"),
        background: token("canvas"),
        foreground: token("ink"),
        canvas: token("canvas"),
        divider: token("divider"),
        "table-header": token("table-header"),
        "chart-soft": token("chart-soft"),
        overlay: token("overlay"),
        "auth-spinner-track": token("auth-spinner-track"),
        brand: {
          ...semanticColor("brand"),
          hover: token("brand-hover"),
          dark: token("brand-hover"),
          muted: token("brand-muted"),
          "soft-text": token("brand-soft-text"),
          contrast: token("on-brand"),
        },
        grey: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => [step, token(`grey-${step}`)])),
        ink: {
          DEFAULT: "var(--ink)",
          muted:  "var(--ink-muted)",
          subtle: "var(--ink-subtle)",
          inverse: token("ink-inverse"),
        },
        surface: {
          DEFAULT: "var(--surface)",
          canvas: "var(--canvas)",
          raised: "var(--surface-raised)",
        },
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
          control: token("line-control"),
        },
        /* Semantic */
        success: { DEFAULT: "var(--success)", soft: "var(--success-soft)" },
        warning: { DEFAULT: "var(--warning)", soft: "var(--warning-soft)" },
        error:   { DEFAULT: "var(--error)",   soft: "var(--error-soft)"   },
        info:    { DEFAULT: "var(--info)",     soft: "var(--info-soft)"    },
        danger: { ...semanticColor("danger"), hover: token("danger-hover") },
        status: Object.fromEntries(statuses.map((status) => [status, { DEFAULT: token(`status-${status}-fg`), soft: token(`status-${status}-bg`) }])),
      },
      borderRadius: {
        DEFAULT: token("radius-md"),
        ...Object.fromEntries(["sm", "md", "lg", "xl", "2xl", "card", "input", "button", "pill"].map((size) => [size, token(`radius-${size}`)])),
        full: token("radius-pill"),
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      spacing: Object.fromEntries(spacing.map((step) => [step, token(`space-${String(step).replace(".", "-")}`)])),
      fontFamily: {
        sans: [token("font-app")],
      },
      fontSize: {
        ...Object.fromEntries(sizes.map((size) => [size, [token(`text-${size}`), { lineHeight: token(`leading-${size}`) }]])),
        page: [token("type-page"), { lineHeight: token("leading-3xl"), letterSpacing: token("tracking-tight"), fontWeight: token("weight-bold") }],
        section: [token("type-section"), { lineHeight: token("leading-lg"), fontWeight: token("weight-semibold") }],
        body: [token("type-body"), { lineHeight: token("leading-sm") }],
        caption: [token("type-caption"), { lineHeight: token("leading-xs") }],
        stat: [token("type-stat"), { lineHeight: token("leading-3xl"), letterSpacing: token("tracking-tight"), fontWeight: token("weight-bold") }],
      },
      fontWeight: { normal: token("weight-regular"), medium: token("weight-medium"), semibold: token("weight-semibold"), bold: token("weight-bold"), extrabold: token("weight-extrabold") },
      letterSpacing: { tight: token("tracking-tight"), label: token("tracking-label") },
      transitionDuration: { fast: token("motion-fast"), normal: token("motion-normal") },
    },
  },
};

export default config;
