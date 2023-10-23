import { modalAnatomy } from "@chakra-ui/anatomy";
import {
  ComponentStyleConfig,
  createMultiStyleConfigHelpers,
  extendTheme
} from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(modalAnatomy.keys);

const baseStyle = definePartsStyle({
  dialog: {
    bg: "neutral.900",
    border: "1px solid",
    borderColor: "neutral.600",
    padding: [2, 4],
    rounded: "2xl"
  }
});

export const modalTheme = defineMultiStyleConfig({ baseStyle });

export const theme = extendTheme({
  colors: {
    neutral: {
      100: "#f6f6f6",
      500: "#808080",
      600: "#4d4d4d",
      800: "#242424",
      900: "#171717",
      950: "#0a090c"
    },

    zinc: {
      950: "#0a090c"
    }
  },

  styles: {
    global: {
      body: {
        color: "neutral.100",
        bg: "neutral.950",
        fontWeight: "medium",
        minH: "100vh"
      }
    }
  },

  fonts: {
    heading: "Urbanist, sans-serif",
    body: "Urbanist, sans-serif"
  },

  config: {
    initialColorMode: "dark",
    useSystemColorMode: false
  },

  components: {
    Button: {
      baseStyle: {},
      variants: {
        _disabled: {
          bg: "white"
        },
        ghost: {
          bg: "neutral.800",
          _disabled: {
            bg: "neutral.800",
            _hover: {
              bg: "neutral.800"
            }
          }
        }
      },
      sizes: {
        md: {
          h: "42px",
          px: 7,
          py: 3
        },
        xl: {
          h: "55px",
          px: 10,
          py: 4,
          rounded: "lg"
        }
      }
    } satisfies ComponentStyleConfig,
    Modal: modalTheme
  }
});
