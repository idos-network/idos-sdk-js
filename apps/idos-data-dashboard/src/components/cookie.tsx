import { useState } from "react";
import { useCookieConsent } from "@/lib/cookie";
import { Button } from "./ui/button";

const CookieBanner = () => {
  const { consent, isLoading, updateConsent } = useCookieConsent();
  const [expanded, setExpanded] = useState(false);

  const handleCookie = (accepted: number) => {
    updateConsent(accepted);
  };

  // Don't show banner if loading, or if consent has been given
  if (isLoading || consent !== null) {
    return null;
  }

  return (
    <div className="fixed right-0 bottom-0 left-0 z-1000 flex bg-background text-foreground">
      <div className="flex w-full flex-row justify-center gap-5 p-6 align-start">
        <div
          className="cookies_banner-disclaimer color-ui-text-light relative max-w-7xl cursor-pointer text-sm"
          style={{
            maxHeight: expanded ? "none" : "98px",
            overflow: expanded ? "visible" : "hidden",
          }}
        >
          By pressing the approving button I voluntarily give my consent to set or activate cookies
          and external connections. I know their functions because they are described in the{" "}
          <a
            href="https://www.idos.network/legal/privacy-policy"
            className="footer_block-link"
            style={{
              color: "#7a7a7a",
              textDecoration: "none",
            }}
          >
            Privacy Policy
          </a>
          {", "}or explained in more detail in documents or external links implemented there. There
          are cookies that are necessary and stored on your browser as they are essential for the
          working of basic functionalities of the website. We also use third-party cookies that help
          us track errors and analyze and understand how you use this website. These cookies will be
          stored in your browser only with your consent. You also have the option to opt-out of
          these cookies. But opting out of some of these cookies may affect your browsing
          experience. By pressing this button, I also voluntarily give my explicit consent pursuant
          to Article 49 (1) (1) (a) GDPR for other data transfers to third countries to the and by
          the companies mentioned in the{" "}
          <a
            href="https://www.idos.network/legal/privacy-policy"
            className="footer_block-link"
            style={{
              color: "#7a7a7a",
              textDecoration: "none",
            }}
          >
            Privacy Policy
          </a>{" "}
          and purposes, in particular for such transfers to third countries for which an adequacy
          decision of the EU/EEA is absent or does exist, and to companies or other entities that
          are not subject to an existing adequacy decision on the basis of self-certification or
          other accession criteria, and that involve significant risks and no appropriate safeguards
          for the protection of my personal data. When giving my voluntary and explicit consent, I
          was aware that an adequate level of data protection may not exist in third countries and
          that my data subjects rights may not be enforceable. I have the right to withdraw my data
          protection consent at any time with effect for the future, by changing my cookie
          preferences or deleting my cookies. The withdrawal of consent shall not affect the
          lawfulness of processing based on consent before its withdrawal. With a single action
          (pressing the approving button), several consents are granted. These are consents under
          EU/EEA data protection law as well as those under CCPA/CPRA, ePrivacy and telemedia law,
          and other international legislation, that are, among other things, necessary for storing
          and reading out information and are required as a legal basis for planned further
          processing of the data read out. I am aware that I can refuse my consent by clicking on
          the decline button. With my action I also confirm that I have read and taken note of the{" "}
          <a
            href="https://www.idos.network/legal/privacy-policy"
            className="footer_block-link"
            style={{
              color: "#7a7a7a",
              textDecoration: "none",
            }}
          >
            Privacy Policy
          </a>{" "}
          and the{" "}
          <a
            href="https://drive.google.com/file/d/1lzrdgD_dwusE4xsKw_oTUcu8Hq3YU60b/view?usp=sharing"
            className="footer_block-link"
            style={{
              color: "#7a7a7a",
              textDecoration: "none",
            }}
          >
            Transparency Document
          </a>
          .
          {expanded && (
            <div className="mt-2">
              <button
                type="button"
                className="cookies_banner-disclaimer-expand color-ui-text-light cursor-pointer border-0 bg-transparent p-0 text-left text-sm"
                onClick={() => setExpanded(false)}
              >
                Read less
              </button>
            </div>
          )}
          {!expanded && (
            <div
              className="absolute right-0 bottom-0 left-0 bg-background text-right text-foreground"
              style={{ paddingTop: "16px" }}
            >
              <button
                type="button"
                className="cookies_banner-disclaimer-expand color-ui-text-light cursor-pointer border-0 bg-transparent p-0 text-right text-sm"
                onClick={() => setExpanded(true)}
              >
                Read more
              </button>
            </div>
          )}
        </div>

        <div className="cookies_banner-buttons flex items-center gap-3">
          <Button onClick={() => handleCookie(0)} variant="outline">
            <p>Decline</p>
          </Button>
          <Button onClick={() => handleCookie(1)}>
            <p>Accept all</p>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
