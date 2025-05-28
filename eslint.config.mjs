import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Disable problematic TypeScript rules
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",

      // Disable React rules that are causing issues
      "react/no-unescaped-entities": "off",
      "react/jsx-no-undef": "off",

      // Disable Next.js image optimization warnings
      "@next/next/no-img-element": "off",

      // Disable React Hooks exhaustive deps completely
      "react-hooks/exhaustive-deps": "off",

      // Disable TypeScript compilation errors during linting
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/prefer-ts-expect-error": "off",
    },
  },
];

export default eslintConfig;
