import nextPlugin from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "node_modules",
      ".next",
      "out",
      "dist",
      "coverage",
      "playwright-report",
      "eslint-report.json",
    ],
  },
  nextPlugin.configs["core-web-vitals"],
  eslintConfigPrettier,
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
];
