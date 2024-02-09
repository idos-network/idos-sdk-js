import { Button, HStack, Heading, Link, Stack, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";

function storeCookieConsentResult(consent: boolean) {
  // Store the consent result as a cookie
  // The key is 'cookieConsent' and the value is the consent result
  // The cookie will expire in 365 days
  const date = new Date();
  date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `idOSCookieConsent=${consent.toString()}${expires}; path=/`;
}

function getCookieConsentResult(): boolean | null {
  // Get all cookies
  const cookies = document.cookie.split("; ");

  // Find the 'cookieConsent' cookie
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const [name, value] = cookie.split("=");

    // If the 'cookieConsent' cookie is found, return its value
    if (name === "idOSCookieConsent") {
      return value === "true";
    }
  }

  // If the 'cookieConsent' cookie is not found, return null
  return null;
}

export const CookieConsent = () => {
  const [value, setValue] = useState(getCookieConsentResult());

  const onAccept = () => {
    storeCookieConsentResult(true);
    setValue(true);
  };

  const onReject = () => {
    storeCookieConsentResult(false);
    setValue(false);
  };

  if (value !== null) {
    return null;
  }

  return (
    <Stack
      flexDir={{
        base: "column",
        lg: "row"
      }}
      align="stretch"
      justify="space-between"
      pos="fixed"
      bottom={0}
      p={5}
      gap={5}
      w="100%"
      bg="neutral.900"
      shadow="lg"
    >
      <VStack align="stretch" gap={1.5}>
        <Heading size="md">We value your privacy</Heading>
        <Text color="neutral.500" fontSize="sm" align="justify">
          We do not use non-essential cookies on this website, but we do collect some important data
          in order to properly customize the website for you. We collect the URL of the website you
          visited before our website, bounce rate, session record, time spent on the site and
          sub-pages, mouse events, your device type and browser information. If you do not consent
          to the collection of the above data, click "decline."
          <Link
            color="green.200"
            href="https://drive.google.com/file/d/1QcOwFjAove024h0pdiFIrqujraEfzV1c/view?usp=drive_link"
            target="_blank"
          >
            Privacy Policy
          </Link>
        </Text>
      </VStack>
      <HStack justify="end">
        <Button colorScheme="green" size="sm" variant="outline" onClick={onReject}>
          Reject all
        </Button>
        <Button colorScheme="green" size="sm" onClick={onAccept}>
          Accept all
        </Button>
      </HStack>
    </Stack>
  );
};
