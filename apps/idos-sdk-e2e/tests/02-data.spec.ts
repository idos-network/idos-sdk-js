import { MetaMask, metaMaskFixtures, testWithSynpress } from "@synthetixio/synpress";
import basicSetup from "./wallet-setup/basic.setup";

const test = testWithSynpress(metaMaskFixtures(basicSetup));

const { expect } = test;

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(120000);

  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});

const TEST_WALLET_ADDRESS = "0xB5B3a244943E5A64511673528e003BE79B18901a";

test("should fetch credentials successfully", async ({
  context,
  page,
  metamaskPage,
  extensionId,
}) => {
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "MetaMask installed" }).click();
  await metamask.switchAccount("Account 1");
  await metamask.connectToDapp(["Account 1"]);
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();
  const list = page.locator("#credentials-list");
  await expect(list.getByRole("listitem")).toHaveCount(2);
});

test("should fetch wallets successfully", async ({ context, page, metamaskPage, extensionId }) => {
  await page.goto("/wallets");
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "MetaMask installed" }).click();
  await metamask.switchAccount("Account 1");
  await metamask.connectToDapp(["Account 1"]);
  await page.waitForTimeout(3000);
  await metamask.confirmSignature();
  const list = page.locator("#wallets-list");
  await expect(list.getByRole("listitem")).toHaveCount(1);
  const address = await metamask.getAccountAddress();
  await expect(list.getByRole("listitem").first().locator("p").last()).toHaveText(
    address.toLocaleLowerCase(), // The address is stored in lowercase format in the idOS so we need to normalize the MetaMask address.
  );
});

test("should add / delete a wallet successfully", async ({
  context,
  page,
  metamaskPage,
  extensionId,
}) => {
  await page.goto("/wallets");
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "MetaMask installed" }).click();
  await metamask.switchAccount("Account 1");
  await metamask.connectToDapp(["Account 1"]);
  await page.waitForTimeout(3000);
  await metamask.confirmSignature();
  // Testing wallet addition
  const addWalletButton = page.locator("#add-wallet-button");
  await addWalletButton.click();
  await page.locator("#address").fill(TEST_WALLET_ADDRESS);
  await page.locator("#add-wallet-form-submit").click();
  await metamask.confirmSignature();
  await page.waitForTimeout(5000);
  const list = page.locator("#wallets-list");
  await expect(list.getByRole("listitem")).toHaveCount(2);

  // Testing wallet deletion
  const deleteButton = list.locator(`#delete-wallet-${TEST_WALLET_ADDRESS}`);
  await deleteButton.click();
  await page.locator(`#confirm-delete-wallet-${TEST_WALLET_ADDRESS}`).click();
  await metamask.confirmSignature();
  await page.waitForTimeout(5000);
  await expect(list.getByRole("listitem")).toHaveCount(1);
});
