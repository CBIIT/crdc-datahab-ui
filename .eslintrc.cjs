/* eslint-env node */
module.exports = {
  extends: [
    'eslint:recommended', 'plugin:@typescript-eslint/recommended'
    ],
  parser: '@typescript-eslint/parser',
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 11,
    "project": "./tsconfig.json",
    "sourceType": "module"
  },
  "plugins": ["react", "@typescript-eslint"],
  "settings": {
    "react": {
      "pragma": "React",
      "fragment": "Fragment",
      "version": "detect"
    }
  },
  root: true,
   "rules": {
    // Note: you must disable the base rule as it can report incorrect errors
    "no-empty-function": "off",
    "@typescript-eslint/no-empty-function": "error",
    "prettier/prettier": "off",
    "react/jsx-filename-extension": "off",
    "import/no-unresolved": "off",
    "import/extensions": "off",
    "react/display-name": "off",
    "@typescript-eslint/comma-dangle": "off",
    "import/prefer-default-export": "off",
    "jsx-a11y/anchor-is-valid": "off",
    "comma-dangle": "off",
    "max-len": "off",
    "no-console": "off",
    "no-param-reassign": "off",
    "no-plusplus": "off",
    "no-return-assign": "off",
    "object-curly-newline": "off",
    "react/jsx-props-no-spreading": "off",
    "react/react-in-jsx-scope": "off",
    "react/require-default-props": "off",
    "typescript-eslint/no-unused-vars": "off",
    "import/no-extraneous-dependencies": "off",
    "react/no-unescaped-entities": "off",
    "react/forbid-prop-types": "off",
    "react/jsx-max-props-per-line": [
      1,
      {
        "maximum": 2,
        "when": "multiline"
      }
    ],
    "indent": "off",
    "@typescript-eslint/indent": [0],
    "no-use-before-define": "off",
    "@typescript-eslint/no-use-before-define": ["off"],
    "@typescript-eslint/no-unused-vars": ["off"],
    "@typescript-eslint/no-shadow": ["off"],
    "@typescript-eslint/dot-notation": ["off"],
    "react/prop-types": ["off"],
    "@typescript-eslint/naming-convention": ["off"]
  }
};