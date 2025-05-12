const typescriptEslintPlugin = require("@typescript-eslint/eslint-plugin");
const typescriptEslintParser = require("@typescript-eslint/parser");
const prettierConfig = require("eslint-config-prettier");

const defineConfig = (config) => config;
const globalIgnores = (patterns) => ({ ignores: patterns });

module.exports = defineConfig([
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
    files: ["src/**/*.ts"],
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module", // For TypeScript ESM parsing
      parser: typescriptEslintParser,
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        Buffer: "readonly",
        setInterval: "readonly"
      }
    },
    rules: {
      "eqeqeq": ["error", "always"],
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "semi": ["error", "always"],
      "prefer-const": "error",
      ...prettierConfig.rules
    },
    linterOptions: {
      reportUnusedDisableDirectives: "warn"
    }
  },

  {
    name: "project/tests",
    files: ["src/__tests__/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        before: "readonly",
        after: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        test: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
]);