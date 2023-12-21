import {
  Box,
  Button,
  HStack,
  Heading,
  Link,
  Stack,
  Text,
  VStack,
  chakra,
  useDisclosure
} from "@chakra-ui/react";
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
  const { isOpen, onToggle } = useDisclosure();
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
          By pressing the approving button I voluntarily give my consent to set or activate cookies
          and external connections. I know their functions because they are described in the Privacy
          Policy or explained in more detail in documents or external links implemented there.
        </Text>
        {isOpen ? (
          <Text color="neutral.500" fontSize="sm" align="justify">
            By pressing this button, I also voluntarily give my explicit consent pursuant to Article
            49 (1) (1) (a) GDPR for personalized advertising and for other data transfers to third
            countries to the and by the companies mentioned in the Privacy Policy and purposes, in
            particular for such transfers to third countries for which an adequacy decision of the
            EU/EEA is absent or does exist, and to companies or other entities that are not subject
            to an existing adequacy decision on the basis of self-certification or other accession
            criteria, and that involve significant risks and no appropriate safeguards for the
            protection of my personal data (e.g., because of Section 702 FISA, Executive Order
            EO12333 and the CloudAct in the USA). When giving my voluntary and explicit consent, I
            was aware that an adequate level of data protection may not exist in third countries and
            that my data subjects rights may not be enforceable. I have the right to withdraw my
            data protection consent at any time with effect for the future, by changing my cookie
            preferences or deleting my cookies. The withdrawal of consent shall not affect the
            lawfulness of processing based on consent before its withdrawal. With a single action
            (pressing the approving button), several consents are granted. These are consents under
            EU/EEA data protection law as well as those under CCPA/CPRA, ePrivacy and telemedia law,
            and other international legislation, that are, among other things, necessary for storing
            and reading out information and are required as a legal basis for planned further
            processing of the data read out. I am aware that I can refuse my consent by clicking on
            the other button or, if necessary, make individual settings. With my action I also
            confirm that I have read and taken note of the{" "}
            <Link
              color="green.200"
              href="https://app.fractal.id/documents/41a635413a9fd3081492/privacy-policy-v11.pdf"
              target="_blank"
            >
              Privacy Policy
            </Link>{" "}
            and the{" "}
            <Link
              color="green.200"
              href="https://fractal.id/documents/transparency-document"
              target="_blank"
            >
              Transparency Document.
            </Link>
          </Text>
        ) : null}

        <Box>
          <chakra.button onClick={onToggle} color="green.100" fontSize="sm">
            {isOpen ? "Read less" : "Read more"}
          </chakra.button>
        </Box>
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
