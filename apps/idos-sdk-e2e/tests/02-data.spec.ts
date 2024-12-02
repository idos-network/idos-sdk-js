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

const TEST_WALLET_ADDRESS = "0x8Bf421D4fe039000981ee77163eF777718af68e3";

test("should fetch credentials successfully", async ({ context, page, extensionId }) => {
  const metamask = new MetaMask(context, page, basicSetup.walletPassword, extensionId);

  await page.goto("/");
  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).first().click();

  await metamask.connectToDapp();
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();

  const list = page.locator("#credentials-list");
  await expect(list.getByRole("listitem")).toHaveCount(3);
});

test("should fetch wallets successfully", async ({ context, page, extensionId }) => {
  await page.goto("/");
  const metamask = new MetaMask(context, page, basicSetup.walletPassword, extensionId);

  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).first().click();

  await metamask.connectToDapp();
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();

  await page.getByTestId("wallets-link").click();
  await page.waitForTimeout(3000);

  const walletListItems = await page.getByTestId("wallet-card");
  const walletListItemsCount = await walletListItems.count();

  const [connectedWallet] = await page.evaluate(() =>
    // @ts-ignore for some reason using metamask.getAddress() is not working
    ethereum.request({
      method: "eth_accounts",
      params: [],
    }),
  );
  await expect(walletListItemsCount).toBeGreaterThanOrEqual(1);
  // Check if the connected wallet exists in the list
  let walletFound = false;

  for (let i = 0; i < walletListItemsCount; i++) {
    const walletText = await walletListItems.nth(i).getByTestId("wallet-address").textContent();

    if (walletText.toLowerCase() === connectedWallet.toLowerCase()) {
      walletFound = true;
      break;
    }
  }
  expect(walletFound).toBeTruthy();
});

// test("should add / delete a wallet successfully", async ({
//   context,
//   page,
// }) => {
//   await page.goto("/wallets");
//   const metamask = new MetaMask(context, page, basicSetup.walletPassword);
//   await page.getByRole("button", { name: "Connect a wallet" }).click();
//   await page.getByRole("button", { name: "Metamask" }).first().click();
//   await metamask.switchAccount("Account 1");
//   await metamask.connectToDapp(["Account 1"]);
//   await page.waitForTimeout(3000);
//   await metamask.confirmSignature();
//   // Testing wallet addition
//   const addWalletButton = page.locator("#add-wallet-button");
//   await addWalletButton.click();
//   await page.locator("#address").fill(TEST_WALLET_ADDRESS);
//   await page.locator("#add-wallet-form-submit").click();
//   await metamask.confirmSignature();
//   await page.waitForTimeout(5000);
//   const list = page.locator("#wallets-list");
//   await expect(list.getByRole("listitem")).toHaveCount(2);

//   // Testing wallet deletion
//   const deleteButton = list.locator(`#delete-wallet-${TEST_WALLET_ADDRESS}`);
//   await deleteButton.click();
//   await page.locator(`#confirm-delete-wallet-${TEST_WALLET_ADDRESS}`).click();
//   await metamask.confirmSignature();
//   await page.waitForTimeout(5000);
//   await expect(list.getByRole("listitem")).toHaveCount(1);
// });
