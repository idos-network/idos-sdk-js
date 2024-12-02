import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import basicSetup from "../test/wallet-setup/wallet-setup.setup";

const test = testWithSynpress(metaMaskFixtures(basicSetup));
// const credentialContent = process.env.CREDENTIAL_CONTENT as string;

const { expect } = test;

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(120000);
  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});

test("should decrypt a credential successfully", async ({ context, page, extensionId }) => {
  const metamask = new MetaMask(context, page, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).first().click();

  await metamask.connectToDapp();
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();
  await page.waitForTimeout(2000);

  await page.getByRole("button", { name: "View details" }).first().click();
  const idOSButton = page.frameLocator("#idos-enclave-iframe").first().locator("#unlock");
  await idOSButton.click();
  const idOSPopup = await page.waitForEvent("popup");
  await page.waitForTimeout(2000);
  //   await (await idOSPopup.waitForSelector("#auth-method-password")).click();
  await idOSPopup.locator("#auth-method-password").click();

  const passwordInput = await idOSPopup.locator("#idos-password-input");
  await passwordInput.fill("752@Hi-idos");
  await idOSPopup.getByRole("button", { name: "Unlock" }).click();

  const code = await page.locator("#credential-details").textContent();
  const parsedContent = JSON.parse(code);
  expect(parsedContent).toHaveProperty("@context");
});

test("should filter credentials by country successfully", async ({
  context,
  page,
  extensionId,
}) => {
  await page.goto("/e2e/credential-filtering-by-country?country=PS");
  const metamask = new MetaMask(context, page, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).first().click();

  await metamask.connectToDapp();
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();
  await page.waitForTimeout(2000);

  const idOSButton = page.frameLocator("#idos-enclave-iframe").first().locator("#unlock");
  await idOSButton.click();
  const idOSPopup = await page.waitForEvent("popup");
  await page.waitForTimeout(2000);
  await idOSPopup.locator("#auth-method-password").click();

  const passwordInput = await idOSPopup.locator("#idos-password-input");
  await passwordInput.fill("752@Hi-idos");
  await idOSPopup.getByRole("button", { name: "Unlock" }).click();

  const list = page.locator("#credentials-list");

  await expect(list.getByRole("listitem")).toHaveCount(1);
});
