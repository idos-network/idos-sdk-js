import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import basicSetup from "../test/wallet-setup/wallet-setup.setup";

const test = testWithSynpress(metaMaskFixtures(basicSetup));

const { expect } = test;

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(120000);
  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});

test("should login successfully with an EVM wallet", async ({ context, page, extensionId }) => {
  const metamask = new MetaMask(context, page, basicSetup.walletPassword, extensionId);
  await page.goto("/");

  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).first().click();

  await metamask.connectToDapp();
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();

  await expect(page.locator("#disconnect-wallet-btn")).toBeVisible();
});

// @ts-ignore
test("should set successfully an EVM signer", async ({ context, page, extensionId }) => {
  const metamask = new MetaMask(context, page, basicSetup.walletPassword, extensionId);

  await page.goto("/");
  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).first().click();

  await metamask.connectToDapp();
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();

  const [connectedWallet] = await page.evaluate(() =>
    // @ts-ignore for some reason using metamask.getAddress() is not working
    ethereum.request({
      method: "eth_accounts",
      params: [],
    }),
  );
  const idosSigner = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("idOS-signer-address")!),
  );
  expect(connectedWallet.toLowerCase()).toEqual(idosSigner.toLowerCase());
});
