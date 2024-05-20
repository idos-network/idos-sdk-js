import { MetaMask, metaMaskFixtures, testWithSynpress } from "@synthetixio/synpress";
import basicSetup from "./wallet-setup/basic.setup";

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
  await metamask.connectToDapp(["Pristine"]);
  await page.waitForTimeout(2000);
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
  await metamask.switchAccount("Account 1");
  await metamask.connectToDapp(["Account 1"]);
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();

  const signer = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("idOS-signer-address") ?? ""),
  );
  const address = await metamask.getAccountAddress();
  expect(signer).toEqual(address);
});
