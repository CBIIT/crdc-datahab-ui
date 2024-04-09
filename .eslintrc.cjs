/* eslint-env node */
/**
 * @type {import("eslint").Linter.Config}
 */
const config = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsx-a11y/recommended",
    "airbnb",
    "airbnb-typescript",
    "prettier",
    "plugin:storybook/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
    project: "./tsconfig.json",
    sourceType: "module",
  },
  plugins: ["react", "@typescript-eslint", "jsx-a11y", "prettier"],
  settings: {
    react: {
      pragma: "React",
      fragment: "Fragment",
      version: "detect",
    },
  },
  root: true,
  ignorePatterns: ["public/js/*.js"],
  rules: {
    /* base prettier rule */
    "prettier/prettier": "error",

    "import/prefer-default-export": "off",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: ["**/*.{stories,test,spec}.{ts,tsx}"],
        optionalDependencies: false,
      },
    ],
    "max-len": "off",
    "no-console": "warn",
    "no-param-reassign": "off",
    "object-curly-newline": "off",
    "no-underscore-dangle": ["off"],
    "arrow-body-style": ["warn"],
    "eol-last": ["warn"],
    "no-unreachable": ["warn"],

    /* typescript-eslint overwritten rules */
    "no-use-before-define": "off",
    "no-unused-vars": "off",
    "no-loss-of-precision": "off",
    "no-shadow": "off",
    "no-empty-function": "off",

    /* react rules */
    "react/prop-types": "off",
    "react/jsx-filename-extension": [1, { extensions: [".js", ".jsx", ".tsx", ".ts"] }],
    "react/jsx-props-no-spreading": "off",
    "react/react-in-jsx-scope": "off",
    "react/require-default-props": "off",
    "react/jsx-max-props-per-line": [1, { maximum: 1, when: "multiline" }],
    "react/function-component-definition": [
      "error",
      {
        namedComponents: "arrow-function",
        unnamedComponents: "arrow-function",
      },
    ],
    "react/jsx-key": [
      "error",
      {
        checkFragmentShorthand: true,
        checkKeyMustBeforeSpread: true,
        warnOnDuplicates: true,
      },
    ],
    "react/destructuring-assignment": ["error", "always", { destructureInSignature: "always" }],

    /* typescript-eslint rules */
    "@typescript-eslint/no-empty-function": "error",
    "@typescript-eslint/no-use-before-define": ["error"],
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-loss-of-precision": "error",
    "@typescript-eslint/no-redundant-type-constituents": "error",
    "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
    "@typescript-eslint/no-shadow": ["off"],
    "@typescript-eslint/dot-notation": ["off"],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "variable",
        format: ["camelCase", "PascalCase", "UPPER_CASE"],
        leadingUnderscore: "allow",
      },
    ],
    "@typescript-eslint/ban-ts-comment": ["off"],
  },
};

module.exports = config;
