import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import basicSetup from "../wallet-setup/basic.setup";

const test = testWithSynpress(metaMaskFixtures(basicSetup));

const PASSPORTING_URL = "https://passporting-demo.vercel.app/";
const ISSUER_DEMO_URL = "https://issuer-sdk-demo.vercel.app/";

const { expect } = test;

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(120000);

  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});

test.describe
  .serial("Sequential Passporting Tests", () => {
    test("No reusable credential found", async ({ context, page, metamaskPage, extensionId }) => {
      await page.goto(PASSPORTING_URL);
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
      await page.getByRole("button", { name: "Connect a wallet" }).click();

      await metamask.connectToDapp();
      await page.waitForTimeout(2000);
      await metamask.confirmSignature();
      await metamask.confirmSignature();

      const header = await page.locator("h3").first();
      await expect(header).toHaveText("No matching credential found");
      await page.waitForTimeout(3000);
    });

    test("should issue a credential successfully using OE1", async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      await page.goto(ISSUER_DEMO_URL); // @todo: replace with issuer demo app url
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
      await page.getByRole("button", { name: "Connect a wallet" }).click();

      await metamask.connectToDapp();
      await page.waitForTimeout(2000);
      await metamask.confirmSignature();

      const popupPromise = page.waitForEvent("popup");

      await page.locator("#view-details-btn").first().click();
      await page.frameLocator("#idos-enclave-iframe").locator("#unlock").click();

      const idOSPopup = await popupPromise;
      await page.waitForTimeout(2000);
      await (await idOSPopup.waitForSelector("#auth-method-password")).click();
      const passwordInput = idOSPopup.locator("#idos-password-input");
      await passwordInput.fill("qwerty");
      await idOSPopup.getByRole("button", { name: "Unlock" }).click();

      await page.locator("#close").click();

      const fetchCredentials = (): Promise<unknown[]> => {
        // biome-ignore lint/suspicious/noAsyncPromiseExecutor: <explanation>
        return new Promise(async (resolve) => {
          const result = await page.evaluate(async () => {
            // @ts-ignore
            const credentials = await window.sdk.data.list("credentials");
            return credentials;
          });
          resolve(result);
        });
      };
      const credentials = await fetchCredentials();
      const currentCredentialsIds = credentials.map((c: any) => c.id);

      const createReusableCredBtn = await page.locator("#create-reusable-credential");
      expect(createReusableCredBtn).toBeVisible();

      await createReusableCredBtn.click();
      await page.waitForTimeout(3000);
      const loadingIndicator = await page.locator('[aria-label="Loading"]');
      await loadingIndicator.waitFor({ state: "detached" });
      const newCredentials = await fetchCredentials();
      const diff = newCredentials.filter((c: any) => !currentCredentialsIds.includes(c.id));
      await page.goto(ISSUER_DEMO_URL);
      expect(diff.length).toBe(1);
    });

    test("Having a matching but not reusable credential", async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      await page.goto(PASSPORTING_URL);
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
      await page.getByRole("button", { name: "Connect a wallet" }).click();

      await metamask.connectToDapp();
      await page.waitForTimeout(2000);
      await metamask.confirmSignature();
      await metamask.confirmSignature();

      const header = await page.locator("h3").first();
      await expect(header).toHaveText("We have found a matching credential that we can reuse:");
      await page.waitForTimeout(3000);
    });
    test("request a reusable credential", async ({ context, page, metamaskPage, extensionId }) => {
      await page.goto(PASSPORTING_URL);
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
      await page.getByRole("button", { name: "Connect a wallet" }).click();

      await metamask.connectToDapp();
      await page.waitForTimeout(2000);
      await metamask.confirmSignature();
      await metamask.confirmSignature();

      const header = await page.locator("h3").first();
      await expect(header).toHaveText("We have found a matching credential that we can reuse:");
      await page.getByRole("button", { name: "Request credential duplicate" }).click();

      const popupPromise = page.waitForEvent("popup");
      await page.frameLocator("#idos-enclave-iframe").locator("#unlock").click();
      const idOSPopup = await popupPromise;
      await page.waitForTimeout(2000);
      await (await idOSPopup.waitForSelector("#auth-method-password")).click();
      const passwordInput = idOSPopup.locator("#idos-password-input");
      await passwordInput.fill("qwerty");
      await idOSPopup.getByRole("button", { name: "Unlock" }).click();

      // message to be signed
      await metamask.confirmSignature();
      await page.waitForTimeout(2000);

      // share credential tx signature
      await metamask.confirmSignature();

      const newHeader = await page.locator("h3").first();
      await page.waitForTimeout(2000);
      await expect(newHeader).toHaveText("You have successfully shared your credential with us!");
    });

    test("Having a reusable credential", async ({ context, page, metamaskPage, extensionId }) => {
      await page.goto(PASSPORTING_URL);
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
      await page.getByRole("button", { name: "Connect a wallet" }).click();

      await metamask.connectToDapp();
      await page.waitForTimeout(2000);
      await metamask.confirmSignature();
      await metamask.confirmSignature();

      const header = await page.locator("h3").first();
      await expect(header).toHaveText("You have successfully shared your credential with us!");
      await page.waitForTimeout(3000);

      await page.goto(ISSUER_DEMO_URL);

      await page.getByRole("button", { name: "Connect a wallet" }).click();

      await metamask.connectToDapp();
      await page.waitForTimeout(2000);
      await metamask.confirmSignature();

      await page.getByRole("button", { name: "Revoke" }).first().click();
      await page.waitForTimeout(2000);
    });
  });
