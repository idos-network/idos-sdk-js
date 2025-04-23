import crypto from "node:crypto";
import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import basicSetup from "../wallet-setup/basic.setup";

const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

const consumerAndIssuerUrl = "https://consumer-and-issuer-demo.playground.idos.network/";
const dashboardUrl = "https://dashboard.playground.idos.network";

// Helper function to generate random private key
const generatePrivateKey = () => {
  return Array.from(crypto.randomBytes(32))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

test.beforeEach(async ({ context, page, metamask }) => {
  test.setTimeout(120000);

  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});

test("should create a profile successfully using new wallet", async ({
  context,
  page,
  metamaskPage,
  extensionId,
}) => {
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  // generate random private key
  const privateKey = generatePrivateKey();
  await metamask.importWalletFromPrivateKey(privateKey);

  await page.goto(consumerAndIssuerUrl);

  await page.getByRole("button", { name: "Get Started now" }).first().click();
  await page.getByRole("button", { name: "Metamask" }).click();

  await metamask.connectToDapp();

  const isleIframe = page.frameLocator("#idOS-isle > iframe");

  const popupPromise = page.waitForEvent("popup");

  const createProfileButton = isleIframe.getByRole("button", { name: "Create idOS profile" });
  await expect(createProfileButton).toBeVisible({ timeout: 10000 });
  await createProfileButton.click();

  const unlockButton = page.frameLocator("#idos-enclave-iframe").locator("#unlock");
  await unlockButton.waitFor({
    state: "visible",
  });
  await unlockButton.click();

  const idOSPopup = await popupPromise;

  const passwordInput = idOSPopup.locator("#idos-password-input");
  await passwordInput.fill("qwerty");
  await idOSPopup.getByRole("button", { name: "Create password" }).click();

  await page.waitForTimeout(2000);
  await metamask.confirmSignature();

  await page.waitForTimeout(6000);
  await metamask.confirmSignature();
  await page.waitForTimeout(16000);

  await expect(isleIframe.locator(".status-badge").first()).toHaveText("pending permissions");

  await metamask.confirmSignature();
  await page.waitForTimeout(3000);

  await expect(isleIframe.locator(".status-badge").first()).toHaveText("verified");

  await isleIframe.locator("#view-credential").click({ timeout: 10000 });
  await page.waitForTimeout(3000);

  await expect(isleIframe.locator("p", { hasText: "basic+liveness" })).toBeVisible();
  isleIframe.locator("a", { hasText: "Permissions" }).click();

  const claimCardButton = await page.getByRole("button", { name: "Claim your card" });
  await claimCardButton.click();

  await expect(claimCardButton).toBeDisabled();

  await page.waitForTimeout(1000);
  await metamask.confirmSignature();

  await page.waitForTimeout(1000);
  await metamask.confirmSignature();

  await expect(claimCardButton).not.toBeVisible();

  await expect(isleIframe.locator("p", { hasText: "KYC DATA" })).toHaveCount(2);
});

test.describe
  .serial("Linking wallet to idOS Dashboard and cleaning up", () => {
    test("should link existing wallet", async ({ context, page, metamaskPage, extensionId }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
      // generate random private key
      const privateKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      await metamask.importWalletFromPrivateKey(privateKey);
      const walletAddress = await metamask.getAccountAddress();

      await page.goto(consumerAndIssuerUrl);
      await page.getByRole("button", { name: "Get Started now" }).first().click();

      await metamask.connectToDapp();

      await page.waitForTimeout(10000);

      const isleIframe = page.frameLocator("#idOS-isle > iframe");

      const createProfileButton = isleIframe.getByRole("button", { name: "Link existing wallet" });
      await expect(createProfileButton).toBeVisible();
      await createProfileButton.click();
      const linkWalletButton = isleIframe.getByRole("button", {
        name: "Link wallet to idOS Dashboard",
      });
      await expect(linkWalletButton).toBeVisible();
      await linkWalletButton.click();
      await page.waitForTimeout(3000);
      const [, dashboardPage] = await context.pages();

      await dashboardPage.getByRole("button", { name: "Connect a wallet" }).click();
      await page.getByRole("button", { name: "Metamask" }).click();
      await metamask.switchAccount("Pristine");
      await metamask.connectToDapp();
      await dashboardPage.waitForTimeout(4000);
      await metamask.confirmSignature();

      expect(await dashboardPage.url()).toContain("wallets?add-wallet");

      const walletAddressInput = dashboardPage.getByRole("textbox", { name: "Wallet address" });

      await expect(walletAddressInput).toHaveValue(walletAddress);

      const addWalletButton = dashboardPage.getByRole("button", { name: "Add wallet" });
      await expect(addWalletButton).toBeVisible();
      await addWalletButton.click();
      await page.waitForTimeout(1000);
      await metamask.confirmSignature();

      const addWalletForm = dashboardPage.getByRole("form", { name: "add-wallet-form" });
      await addWalletForm.waitFor({ state: "detached" });

      await page.waitForTimeout(10000);
      await metamask.confirmSignature();

      const minimizedIsle = isleIframe.locator("#minimized-isle");
      await expect(minimizedIsle).toBeVisible({ timeout: 10000 });
      await minimizedIsle.click();
      await expect(isleIframe.locator(".status-badge").first()).toHaveText("verified");
    });
    test("clean up added wallets", async ({ context, page, metamaskPage, extensionId }) => {
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
      // @todo: should we make this CI variable?
      await page.goto(`${dashboardUrl}/wallets`);

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
