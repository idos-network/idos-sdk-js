import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import basicSetup from "../wallet-setup/basic.setup";

// @todo: This should be created from the sdk instead of relying on hardcoded values.
const _credentialContent = process.env.CREDENTIAL_CONTENT as string;

const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(120000);

  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});

test("should decrypt a credential successfully", async ({
  context,
  page,
  metamaskPage,
  extensionId,
}) => {
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).click();

  await metamask.connectToDapp();
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "View details" }).first().click();
  const idOSButton = page.frameLocator("#idos-enclave-iframe").locator("#unlock");
  await idOSButton.click();
  const idOSPopup = await popupPromise;
  await page.waitForTimeout(2000);
  const passwordInput = idOSPopup.locator("#idos-password-input");
  await passwordInput.fill("qwerty");
  await idOSPopup.getByRole("button", { name: "Unlock" }).click();

  const code = page.locator("#credential-details");

  await expect(code).toContainText(/E2E test|John Mock-Doe/);
});
