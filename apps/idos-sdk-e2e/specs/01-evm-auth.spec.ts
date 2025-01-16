import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import basicSetup from "../wallet-setup/basic.setup";

const test = testWithSynpress(metaMaskFixtures(basicSetup));

const { expect } = test;

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(120000);
  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});

test("should login successfully with an EVM wallet", async ({
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
  await expect(page.locator("#disconnect-wallet-btn")).toBeVisible();
});

test("should set successfully an EVM signer", async ({
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

  const signer = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("idOS-signer-address") ?? ""),
  );
  const address = await metamask.getAccountAddress();
  expect(signer).toEqual(address);
});
