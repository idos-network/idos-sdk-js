import { ChakraProvider, createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";

const config = defineConfig({
  theme: {
    recipes: {
      button: {
        base: {
          colorPalette: "orange",
        },
        variants: {
          variant: {
            solid: {
              bg: "colorPalette.200",
              color: "colorPalette.contrast",
              _hover: {
                bg: "colorPalette.100",
              },
              _focusVisible: {
                outlineColor: "colorPalette.100/80",
              },
            },
          },
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
