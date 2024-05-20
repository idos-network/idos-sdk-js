import { MetaMask, metaMaskFixtures, testWithSynpress } from "@synthetixio/synpress";
import basicSetup from "./wallet-setup/basic.setup";

// @todo: This should be created from the sdk instead of relying on hardcoded values.
const credentialContent = `{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://raw.githubusercontent.com/trustfractal/claim-schemas/686bd9c0b44f8af03831f7dc31f7d6a9b6b5ff5b/verifiable_credential/fractal_id.json-ld",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "uuid:8b38a9ad-58c9-4758-84f0-0f99e04b658a",
  "type": [
    "VerifiableCredential"
  ],
  "issuer": "https://vc-issuers.next.fractal.id/idos",
  "level": "human",
  "credentialSubject": {
    "id": "uuid:f1839b5c-af8e-473e-9980-fb7713a48561",
    "wallets": [
      {
        "currency": "eth",
        "verified": true,
        "address": "0x5f6015c69059ca003354a2917827ce718cf01c0c"
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
  "issuanceDate": "2024-05-24T15:25:51Z",
  "approved_at": "2024-05-24T15:25:51Z",
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2024-05-24T15:26:13Z",
    "verificationMethod": "https://vc-issuers.next.fractal.id/idos#z6Mkqm5JuLvBcHkbQogDXz5p5ppTY4DF5FLhoRd2VM9NaKp5",
    "proofPurpose": "assertionMethod",
    "@context": [
      "https://www.w3.org/ns/credentials/v2"
    ],
    "proofValue": "z2VqZk9KVf1LgGQ15Rk3genW6EhN5aKnZnutXPc4oPurenC9j1bUVKBLUgTCu4dmLixLAXgChUWmBeiXrZ8hzXj3"
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
