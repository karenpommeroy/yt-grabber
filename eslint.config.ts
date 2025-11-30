import react from "eslint-plugin-react";
import {Config, defineConfig} from "eslint/config";
import globals from "globals";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {FlatCompat} from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

type EslintConfig = Config & {
    extends?: any[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

const TestConfig: EslintConfig  = {
    extends: compat.extends(
        // "eslint:recommended",
        "plugin:react/recommended",
        // "plugin:@typescript-eslint/recommended",
        "prettier",
    ),
    plugins: {
        react,
        "@typescript-eslint": typescriptEslint as any,
    },
    languageOptions: {
        globals: {
            ...globals.browser,
        },

        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
    },
    settings: {
        react: {
            version: "detect",
        },
    },
    files: ["**/*.test.{ts,tsx,js,jsx}"],
    rules: {
        indent: ["warn", 4],
        "linebreak-style": ["warn", "windows"],
        quotes: ["warn", "double"],
        semi: ["warn", "always"],
        "@typescript-eslint/no-unused-vars": ["warn"],
        "@typescript-eslint/no-var-requires": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-empty-interface": 0,
        "react/prop-types": 0,
        "react/display-name": 0,
        "react/react-in-jsx-scope": 0,
        "import/no-commonjs": "off",
    },
};

const BaseConfig: EslintConfig = {
    extends: compat.extends(
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
    ),

    plugins: {
        react,
        "@typescript-eslint": typescriptEslint as any,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
        },

        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
    },

    settings: {
        react: {
            version: "detect",
        },
    },

    files: [
        "**/!(*.test).{ts,tsx,js,jsx}",
    ],

    rules: {
        indent: ["warn", 4],
        "linebreak-style": ["warn", "windows"],
        quotes: ["warn", "double"],
        semi: ["warn", "always"],
        "@typescript-eslint/no-unused-vars": ["warn"],
        "@typescript-eslint/no-var-requires": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-empty-interface": 0,
        "react/prop-types": 0,
        "react/display-name": 0,
        "react/react-in-jsx-scope": 0,
    },
};

export default defineConfig([
    BaseConfig,
    TestConfig
]);
