import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import typescriptEslintParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";

export default defineConfig([
  globalIgnores([
    "node_modules/**",
    "dist/**",
    "coverage/**",
    "**/*.config.js",
    "!eslint.config.js",
    "**/*.config.ts"
  ]),
  {
    name: "project/base",
    files: ["src/**/*.ts", "tests/**/*.ts"],
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: typescriptEslintParser,
      globals: {
        "process": "readonly",
        "console": "readonly",
        "__dirname": "readonly",
        "module": "readonly",
        "Express": "readonly",
        "Buffer": "readonly",
        "setInterval": "readonly"
      }
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "error",
      "eqeqeq": ["error", "always"],
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "semi": ["error", "always"],
      "prefer-const": "error",
      ...prettierConfig.rules
    },
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
      noInlineConfig: false
    }
  },
  {
    name: "project/tests",
    files: ["src/__tests__/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      globals: {
        "jest": "readonly",
        "describe": "readonly",
        "it": "readonly",
        "expect": "readonly",
        "before": "readonly",
        "after": "readonly",
        "beforeEach": "readonly",
        "afterEach": "readonly",
        "test": "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
]);