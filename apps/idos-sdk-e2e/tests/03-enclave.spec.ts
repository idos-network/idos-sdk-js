import { MetaMask, metaMaskFixtures, testWithSynpress } from "@synthetixio/synpress";
import basicSetup from "./wallet-setup/basic.setup";

// @todo: This should be created from the sdk instead of relying on hardcoded values.
const credentialContent = process.env.CREDENTIAL_CONTENT as string;

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

test("should filter credentials by country successfully", async ({
  context,
  page,
  metamaskPage,
  extensionId,
}) => {
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.goto("e2e/credential-filtering-by-country");

  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).click();
  await metamask.switchAccount("Account 1");
  await metamask.connectToDapp(["Account 1"]);
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();

  const popupPromise = page.waitForEvent("popup");

  const idOSButton = page.frameLocator("#idos-enclave-iframe").locator("#unlock");
  await idOSButton.click();
  const idOSPopup = await popupPromise;
  await page.waitForTimeout(2000);
  await (await idOSPopup.waitForSelector("#auth-method-password")).click();
  const passwordInput = idOSPopup.locator("#idos-password-input");
  await passwordInput.fill("qwerty");
  await idOSPopup.getByRole("button", { name: "Unlock" }).click();

  const list = page.locator("#credentials-list");

  await expect(list.getByRole("listitem")).toHaveCount(0);
});
