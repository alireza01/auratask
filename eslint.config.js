import globals from "globals";
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import nextPlugin from "eslint-config-next"; // This is how nextjs docs say to import it
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    ignores: ["node_modules/", ".next/", "out/", "public/"],
  },
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: prettierPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // ...tseslint.configs["recommended-type-checking"].rules, // Consider adding for stricter type checks
      ...nextPlugin.rules, // May need adjustment based on how nextPlugin is structured
      ...prettierConfig.rules, // Disables ESLint rules that conflict with Prettier
      "prettier/prettier": "warn", // Runs Prettier as an ESLint rule

      // Original custom rules (migrate if still needed)
      "prefer-const": "error",
      // "no-unused-vars": "error", // Covered by @typescript-eslint/no-unused-vars
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": "warn", // Warn for now, was "error"
      // "@typescript-eslint/prefer-const": "error", // This was problematic, covered by prefer-const
      "react-hooks/exhaustive-deps": "warn", // From next/core-web-vitals
      "react/jsx-key": "error", // From next/core-web-vitals
      "react/no-unescaped-entities": "off", // From original config
      "@typescript-eslint/no-explicit-any": "warn", // Default is error, soften for now
    },
  },
  // Configuration for next/core-web-vitals (approximated)
  // Next.js's eslint-config-next often includes rules from eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-jsx-a11y
  // These would ideally be part of the `nextPlugin` object if it's structured as a flat config plugin.
  // If `nextPlugin.rules` directly contains all rules, this section might not be needed or would be different.
  // For now, common Next.js related rules are react-hooks/exhaustive-deps and react/jsx-key which are added above.
];
