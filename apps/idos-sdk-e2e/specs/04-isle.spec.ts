import crypto from "node:crypto";
import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import invariant from "tiny-invariant";
import basicSetup from "../wallet-setup/basic.setup";

const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

const consumerAndIssuerUrl = process.env.CONSUMER_AND_ISSUER_BASE_URL;

// Helper function to generate random private key
const generatePrivateKey = () => {
  return Array.from(crypto.randomBytes(32))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(120000);

  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});
const playgroundTest = process.env.CONSUMER_AND_ISSUER_BASE_URL ? test : test.skip;

playgroundTest(
  "should create a profile successfully using new wallet",
  async ({ context, page, metamaskPage, extensionId }) => {
    invariant(consumerAndIssuerUrl, "CONSUMER_AND_ISSUER_BASE_URL is not set");

    const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
    // generate random private key
    const privateKey = generatePrivateKey();
    await metamask.importWalletFromPrivateKey(privateKey);

    await page.goto(consumerAndIssuerUrl);

    await page.evaluate(() => {
      localStorage.setItem("idOS-is-e2e", "true");
    });

    await page.getByRole("button", { name: "Get Started now" }).first().click();
    await page.getByRole("button", { name: "Metamask" }).click();

    await metamask.connectToDapp();

    const isleIframe = page.frameLocator("#idOS-isle > iframe");

    const popupPromise = page.waitForEvent("popup");

    const createProfileButton = isleIframe.getByRole("button", { name: "Create idOS profile" });
    await expect(createProfileButton).toBeVisible();
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

    await expect(isleIframe.locator(".status-badge").first()).toHaveText("not verified");
    await isleIframe.getByRole("button", { name: "Verify your identity" }).click();
    await page.waitForTimeout(2000);

    await popupPromise;

    const krakenIframe = await page.frameLocator("iframe#kyc-journey");
    const continueButton = krakenIframe.getByRole("button", { name: "Continue" });
    await expect(continueButton).toBeVisible();
    await continueButton.click();

    await page.waitForTimeout(2000);

    const sumSubIframe = await krakenIframe.frameLocator("#sumsub-websdk-container > iframe");
    await expect(sumSubIframe).toBeDefined();

    await sumSubIframe.getByText("All countries except USA", { exact: true }).click();
    await sumSubIframe.getByText("Continue", { exact: true }).click();

    // Select germany and passport
    await sumSubIframe.getByRole("button", { name: "Issuing country*" }).click();
    await sumSubIframe.getByRole("textbox", { name: "Search" }).fill("Germany");
    await sumSubIframe.getByRole("button", { name: "Germany" }).click();
    await sumSubIframe.getByText("Passport", { exact: true }).click();
    await sumSubIframe.getByText("Continue", { exact: true }).click();

    // Upload passport image
    const fileInput = await sumSubIframe.locator('input[type="file"]').first();
    await fileInput.setInputFiles("tests/fixtures/passport.jpg");
    await sumSubIframe.getByText("Continue", { exact: true }).click();
    await metamask.confirmSignature();
    await page.waitForTimeout(3000);
    await metamask.confirmSignature();
    await page.waitForTimeout(3000);
    await expect(isleIframe.locator(".status-badge").first()).toHaveText("verified");

    await isleIframe.locator("button[aria-label='View']").click({ timeout: 10000 });
    await page.waitForTimeout(3000);

    await expect(isleIframe.locator("p", { hasText: "basic" })).toBeVisible();
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
  },
);

test.describe
  .serial("Linking wallet to idOS Dashboard and cleaning up", () => {
    playgroundTest(
      "should link existing wallet",
      async ({ context, page, metamaskPage, extensionId }) => {
        invariant(consumerAndIssuerUrl, "CONSUMER_AND_ISSUER_BASE_URL is not set");
        const metamask = new MetaMask(
          context,
          metamaskPage,
          basicSetup.walletPassword,
          extensionId,
        );
        // generate random private key
        const privateKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        await metamask.importWalletFromPrivateKey(privateKey);
        const walletAddress = await metamask.getAccountAddress();

        await page.goto(consumerAndIssuerUrl);
        await page.getByRole("button", { name: "Get Started now" }).first().click();
        await page.getByRole("button", { name: "Metamask" }).click();

        await metamask.connectToDapp();

        await page.waitForTimeout(10000);

        const isleIframe = page.frameLocator("#idOS-isle > iframe");

        const createProfileButton = isleIframe.getByRole("button", { name: "Login" });
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
      },
    );
  });
