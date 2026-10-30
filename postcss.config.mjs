import path from "node:path";

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    [path.resolve("scripts/tailwind-cascade.cjs")]: {},
  },
};

export default config;
