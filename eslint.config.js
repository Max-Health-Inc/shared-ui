import js from "@eslint/js"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import { sharedRules, typeCheckedRules } from "@max-health-inc/config/eslint/rules"

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

  // Disable type-checked rules for plain-JS files that run outside the tsconfig:
  // the eslint config itself and the build-tool plugin (shipped as JS so Node can
  // import it from node_modules without .ts type-stripping).
  {
    files: ["eslint.config.js", "src/vite/*.js"],
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

      // Org baseline. These were copied out by hand and had already drifted:
      // no-unused-vars was missing caughtErrors/restSiblings, and
      // consistent-type-imports was missing the inline fix style.
      ...sharedRules,
      ...typeCheckedRules,

      // Stricter than the baseline, deliberately: this is a published library,
      // so a non-null assertion or an unawaited async in here becomes a bug in
      // every consuming app.
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/require-await": "error",
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
