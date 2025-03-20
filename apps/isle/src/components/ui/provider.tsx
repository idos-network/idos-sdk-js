import { ChakraProvider, createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";

const config = defineConfig({
  globalCss: {
    body: {
      fontSmooth: "antialiased",
    },
  },

  theme: {
    tokens: {
      colors: {
        aquamarine: {
          DEFAULT: { value: "#00ffb9" },
          50: { value: "#e7fff7" },
          100: { value: "#c6ffea" },
          200: { value: "#92ffdc" },
          300: { value: "#4dffce" },
          400: { value: "#00ffb9" },
          500: { value: "#00e8a6" },
          600: { value: "#00be89" },
          700: { value: "#009873" },
          800: { value: "#00785c" },
          900: { value: "#00624d" },
          950: { value: "#00382d" },
        },
        neutral: {
          50: { value: "#fafafa" },
          100: { value: "#f5f5f5" },
          200: { value: "#e5e5e5" },
          300: { value: "#d4d4d4" },
          400: { value: "#a1a1a1" },
          500: { value: "#737373" },
          600: { value: "#525252" },
          700: { value: "#404040" },
          800: { value: "#262626" },
          900: { value: "#171717" },
          950: { value: "#0b0b0b" },
        },
        amber: {
          400: { value: "#ffbb33" },
          500: { value: "#b47902" },
        },
        red: {
          400: { value: "#e23636" },
        },
      },
    },
    semanticTokens: {
      colors: {
        aquamarine: {
          solid: { value: "{colors.aquamarine.400}" },
          contrast: { value: "{colors.aquamarine.950}" },
          fg: { value: "{colors.aquamarine.700}" },
          muted: { value: "{colors.aquamarine.100}" },
          subtle: { value: "{colors.aquamarine.200}" },
          emphasized: { value: "{colors.aquamarine.300}" },
          focusRing: { value: "{colors.aquamarine.400}" },
        },
        neutral: {
          solid: { value: "{colors.neutral.50}" },
          contrast: { value: "{colors.neutral.950}" },
          fg: { value: "{colors.neutral.700}" },
          muted: { value: "{colors.neutral.100}" },
          subtle: { value: "{colors.neutral.200}" },
        },
      },
    },
    recipes: {
      button: {
        base: {
          colorPalette: "aquamarine",
          rounded: "lg",
        },
      },
    },
  },
});

const system = createSystem(defaultConfig, config);

export function ThemeProvider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  );
}
