import { MetaMask, metaMaskFixtures, testWithSynpress } from "@synthetixio/synpress";
import basicSetup from "./wallet-setup/basic.setup";

// @todo: This should be created from the sdk instead of relying on hardcoded values.
const credentialContent = `{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://raw.githubusercontent.com/trustfractal/claim-schemas/686bd9c0b44f8af03831f7dc31f7d6a9b6b5ff5b/verifiable_credential/fractal_id.json-ld",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "uuid:201149e1-668a-413f-9931-29b2a6828f83",
  "type": [
    "VerifiableCredential"
  ],
  "issuer": "https://vc-issuers.next.fractal.id/idos",
  "level": "human",
  "credentialSubject": {
    "id": "uuid:0b764d0c-457e-483b-9dab-79cd034f3ac5",
    "wallets": [
      {
        "currency": "eth",
        "verified": true,
        "address": "0xdbf901f529a85f0fc309ee4d3ede01c6e648cf54"
      }
    ],
    "emails": [
      {
        "verified": false,
        "address": "user@idos.network"
      }
    ]
  },
  "status": "approved",
  "issuanceDate": "2024-05-31T18:47:33Z",
  "approved_at": "2024-05-31T18:47:33Z",
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2024-05-31T18:47:37Z",
    "verificationMethod": "https://vc-issuers.next.fractal.id/idos#z6Mkqm5JuLvBcHkbQogDXz5p5ppTY4DF5FLhoRd2VM9NaKp5",
    "proofPurpose": "assertionMethod",
    "@context": [
      "https://www.w3.org/ns/credentials/v2"
    ],
    "proofValue": "z3UD9q9Y8TSxC8fY7RSj1YRhAkScgQgHVwn6EKguLEX69GxV3rz9JNJwik3v3W8LtWTnU8gZYBV6EgpqnEB9g4vA"
  }
}`;

const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(120000);

  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});

test("should decrypt a  credential successfully", async ({
  context,
  page,
  metamaskPage,
  extensionId,
}) => {
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).click();
  await metamask.switchAccount("Account 1");
  await metamask.connectToDapp(["Account 1"]);
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "View details" }).first().click();
  const idOSButton = page.frameLocator("#idos-enclave-iframe").locator("#unlock");
  await idOSButton.click();
  const idOSPopup = await popupPromise;
  await page.waitForTimeout(2000);
  await (await idOSPopup.waitForSelector("#auth-method-password")).click();
  const passwordInput = idOSPopup.locator("#idos-password-input");
  await passwordInput.fill("qwerty");
  await idOSPopup.getByRole("button", { name: "Unlock" }).click();

  const code = page.locator("#credential-details");
  await expect(code).toHaveText(credentialContent);
});
