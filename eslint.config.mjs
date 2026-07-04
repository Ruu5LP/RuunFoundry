import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "assets/**", "vscode-extension/**", "plugins/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        __dirname: "readonly",
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
      },
    },
    rules: {
      // 未使用変数はエラー。先頭 _ の引数は意図的な無視として許可
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // catch (e) を握りつぶす箇所があるため warn に留める
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // テストは Node/vitest グローバルを使うため一部ルールを緩める
  {
    files: ["tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  prettier
);
