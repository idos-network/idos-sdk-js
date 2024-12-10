import { MetaMask, metaMaskFixtures, testWithSynpress } from "@synthetixio/synpress";
import basicSetup from "./wallet-setup/basic.setup";

// @todo: This should be created from the sdk instead of relying on hardcoded values.
// const credentialContent = process.env.CREDENTIAL_CONTENT as string;

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
  await page.getByRole("button", { name: "Metamask" }).first().click();
  await metamask.connectToDapp(["Pristine"]);
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();
  await page.waitForTimeout(2000);

  await page.getByRole("button", { name: "View details" }).first().click();
  const idOSButton = await page.frameLocator("#idos-enclave-iframe").locator("#unlock");
  await idOSButton.click();
  const popupPromise = await page.waitForEvent("popup");
  const idOSPopup = await popupPromise;
  await page.waitForTimeout(2000);

  await idOSPopup.locator("#auth-method-password").click();
  const passwordInput = await idOSPopup.locator("#idos-password-input");

  await passwordInput.fill("qwerty");
  await idOSPopup.getByRole("button", { name: "Unlock" }).click();
  await page.waitForTimeout(4000);

  const code = await page.locator("#credential-details").textContent();
  expect(code).toContain("uuid:203490be-fec8-49f9-80d7-fa504a057a0c");
  // uuid:203490be-fec8-49f9-80d7-fa504a057a0c for PROD
  // uuid:087b9cf0-a968-471d-a4e8-a805a05357ed for PLAYGROUND
});

test("should filter credentials by country successfully", async ({
  context,
  page,
  metamaskPage,
  extensionId,
}) => {
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);

  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).first().click();
  await metamask.connectToDapp(["Pristine"]);
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();
  await page.waitForTimeout(2000);
  await page.goto("e2e/credential-filtering-by-country");
  await page.waitForTimeout(2000);

  const idOSButton = await page.frameLocator("#idos-enclave-iframe").locator("#unlock");
  await idOSButton.click();
  const popupPromise = await page.waitForEvent("popup");
  const idOSPopup = await popupPromise;
  await page.waitForTimeout(2000);

  await idOSPopup.locator("#auth-method-password").click();
  const passwordInput = await idOSPopup.locator("#idos-password-input");

  await passwordInput.fill("qwerty");
  await idOSPopup.getByRole("button", { name: "Unlock" }).click();

  const list = page.locator("#credentials-list");

  await expect(list.getByRole("listitem")).toHaveCount(0);
});
