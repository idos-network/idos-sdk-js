import { theme as chakraTheme, extendBaseTheme } from "@chakra-ui/react";

const {
  Alert,
  Button,
  CloseButton,
  Drawer,
  FormLabel,
  Heading,
  Input,
  Modal,
  Spinner,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Switch,
  Table,
} = chakraTheme.components;

export const theme = extendBaseTheme({
  colors: {
    neutral: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
      950: "#0a0a0a",
    },
  },

  styles: {
    global: {
      body: {
        color: "neutral.100",
        bg: "neutral.950",
        minH: "100dvh",
        WebkitFontSmoothing: "antialiased",
      },
    },
  },

  fonts: {
    heading: "Urbanist, sans-serif",
    body: "Urbanist, sans-serif",
  },

  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },

  components: {
    Alert,
    Button,
    CloseButton,
    Drawer,
    FormLabel,
    Heading,
    Input,
    Modal,
    Spinner,
    Switch,
    Step,
    StepDescription,
    StepIcon,
    StepIndicator,
    StepNumber,
    StepSeparator,
    StepStatus,
    StepTitle,
    Stepper,
    Table,
  },
});
