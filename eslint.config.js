import js from "@eslint/js"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"

export default tseslint.config(
  // Base JS recommended
  js.configs.recommended,

  // TypeScript strict + stylistic (applied to all linted files)
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Project-wide settings for type-aware linting
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },

  // Disable type-checked rules for the config file itself — it runs outside tsconfig
  {
    files: ["eslint.config.js"],
    ...tseslint.configs.disableTypeChecked,
  },

  // React source files
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // React hooks
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // TypeScript strictness
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

      // General code quality
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-restricted-syntax": [
        "error",
        { selector: "TSEnumDeclaration", message: "Use const objects instead of enums." },
      ],
    },
  },

  // Ignore build output, generated files, and test files (Bun-only)
  {
    ignores: ["dist/**", "node_modules/**", "vite.config.ts", "src/**/*.test.ts"],
  },
)
