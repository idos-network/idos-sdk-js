import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import { generateSimpleEthAddress } from "../utils/generate-address";
import basicSetup from "../wallet-setup/basic.setup";
const test = testWithSynpress(metaMaskFixtures(basicSetup));

const { expect } = test;

const normalizeAddress = (address: string) => address.trim().toLowerCase();

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(120000);

  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});

test("should fetch credentials successfully", async ({
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
  const list = page.locator("#credentials-list");
  await expect(list.getByRole("listitem")).toHaveCount(1);
});

test.describe
  .serial("Adding and deleting wallets", () => {
    test("should add a wallet successfully", async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      await page.goto("/wallets");
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
      await page.getByRole("button", { name: "Connect a wallet" }).click();
      await page.getByRole("button", { name: "Metamask" }).click();

      await metamask.connectToDapp();
      await page.waitForTimeout(3000);
      await metamask.confirmSignature();

      const walletsList = page.locator("#wallets-list");
      await expect(walletsList).toBeVisible();

      const walletsCount = await walletsList.getByRole("listitem").count();

      // Testing wallet addition
      const addWalletButton = page.locator("#add-wallet-button");
      await addWalletButton.click();

      // Generate a new random wallet
      const walletAddress = generateSimpleEthAddress();
      await page.locator("#address").fill(walletAddress);
      await page.locator("#add-wallet-form-submit").click();
      await metamask.confirmSignature();
      await page.waitForTimeout(5000);
      const list = page.locator("#wallets-list");
      await expect(list.getByRole("listitem")).toHaveCount(walletsCount + 1);

      // Testing wallet deletion
      const deleteButton = await list.locator(`#delete-wallet-${walletAddress}`);
      await deleteButton.click();
      await page.locator(`#confirm-delete-wallet-${walletAddress}`).click();
      await metamask.confirmSignature();
      await page.waitForTimeout(5000);
      await expect(list.getByRole("listitem")).toHaveCount(walletsCount);
    });

    test("clean up added wallets", async ({ context, page, metamaskPage, extensionId }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
      // @todo: should we make this CI variable?

      await page.goto("/wallets");

      await page.getByRole("button", { name: "Connect a wallet" }).click();
      await page.getByRole("button", { name: "Metamask" }).click();

      await metamask.switchAccount("Pristine");
      await metamask.connectToDapp();

      await page.waitForTimeout(2000);
      await metamask.confirmSignature();

      const walletsList = page.locator("#wallets-list");
      await expect(walletsList).toBeVisible();

      const walletsCount = await walletsList.getByRole("listitem").count();

      for (let i = 0; i < walletsCount; i++) {
        if ((await walletsList.getByRole("listitem").count()) === 1) break;

        let wallet = await walletsList.getByRole("listitem").first();

        let deleteBtn = wallet.getByRole("button", { name: "Delete" });
        const isDisabled = await deleteBtn.isDisabled();

        if (isDisabled) {
          wallet = await walletsList.getByRole("listitem").last();
          deleteBtn = wallet.getByRole("button", { name: "Delete" });
        }

        await deleteBtn.click();

        const confirmDeleteBtn = page.getByRole("button", { name: "Delete" }).last();

        await confirmDeleteBtn.click();
        await page.waitForTimeout(1000);
        await metamask.confirmSignature();

        // Wait for the modal to disappear
        const deleteModal = await page.locator('[role="alertdialog"]');
        await expect(deleteModal).not.toBeVisible({ timeout: 10000 });
      }
    });
  });
