module.exports = {
  env: { browser: true, es2020: true, node: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: ["react-refresh", "chakra-ui"],

  rules: {
    "react-refresh/only-export-components": "warn",

    "chakra-ui/props-order": "error",
    "chakra-ui/props-shorthand": "error",
    "chakra-ui/require-specific-component": "error"
  }
};
