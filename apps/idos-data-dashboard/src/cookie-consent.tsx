import {
  Button,
  Flex,
  Heading,
  Link,
  Text,
  chakra,
  useDisclosure
} from "@chakra-ui/react";
import { CookieConsent as CK } from "react-cookie-consent";

export const CookieConsent = () => {
  const disclosure = useDisclosure();

  return (
    <Flex
      pos="fixed"
      bottom="0"
      alignItems="center"
      justifyContent="space-between"
      bg="neutral.900"
      w="full"
    >
      <CK
        cookieName="idos-dashboard-cookie-consent"
        disableStyles
        disableButtonStyles
        enableDeclineButton
        buttonText="Accept All"
        declineButtonText="Reject All"
        ButtonComponent={Button}
        customButtonProps={{
          colorScheme: "green",
          size: "sm"
        }}
        customDeclineButtonProps={{
          variant: "outline",
          mx: 5,
          borderColor: "green.300",
          size: "sm",
          color: "green.300"
        }}
        contentStyle={{
          flex: 1
        }}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          justifyContent: "space-between",
          padding: 24
        }}
      >
        <Heading size="md" mb={2}>
          We value your privacy
        </Heading>
        <Text fontSize="sm" color="neutral.500">
          By pressing the approving button I voluntarily give my consent to set
          or activate cookies and external connections. I know their functions
          because they are described in the Privacy Policy or explained in more
          detail in documents or external links implemented there.
        </Text>

        {disclosure.isOpen ? (
          <Text fontSize="sm" color="neutral.500">
            By pressing this button, I also voluntarily give my explicit consent
            pursuant to Article 49 (1) (1) (a) GDPR for personalized advertising
            and for other data transfers to third countries to the and by the
            companies mentioned in the Privacy Policy and purposes, in
            particular for such transfers to third countries for which an
            adequacy decision of the EU/EEA is absent or does exist, and to
            companies or other entities that are not subject to an existing
            adequacy decision on the basis of self-certification or other
            accession criteria, and that involve significant risks and no
            appropriate safeguards for the protection of my personal data (e.g.,
            because of Section 702 FISA, Executive Order EO12333 and the
            CloudAct in the USA). When giving my voluntary and explicit consent,
            I was aware that an adequate level of data protection may not exist
            in third countries and that my data subjects rights may not be
            enforceable. I have the right to withdraw my data protection consent
            at any time with effect for the future, by changing my cookie
            preferences or deleting my cookies. The withdrawal of consent shall
            not affect the lawfulness of processing based on consent before its
            withdrawal. With a single action (pressing the approving button),
            several consents are granted. These are consents under EU/EEA data
            protection law as well as those under CCPA/CPRA, ePrivacy and
            telemedia law, and other international legislation, that are, among
            other things, necessary for storing and reading out information and
            are required as a legal basis for planned further processing of the
            data read out. I am aware that I can refuse my consent by clicking
            on the other button or, if necessary, make individual settings. With
            my action I also confirm that I have read and taken note of the{" "}
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

        <chakra.button
          onClick={disclosure.onToggle}
          color="green.100"
          fontSize="sm"
        >
          {disclosure.isOpen ? "Read less" : "Read more"}
        </chakra.button>
      </CK>
    </Flex>
  );
};
