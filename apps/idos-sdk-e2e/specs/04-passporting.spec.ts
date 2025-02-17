import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import basicSetup from "../wallet-setup/basic.setup";

const test = testWithSynpress(metaMaskFixtures(basicSetup));

const PASSPORTING_URL = "https://passporting-demo.vercel.app/";
const ISSUER_DEMO_URL = "https://issuer-sdk-demo.vercel.app/";
const DATA_DASHBOARD_URL = "https://dashboard.staging.idos.network/"

const { expect } = test;

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(120000);

  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});

test.describe
  .serial("Sequential Passporting Tests", () => {
    test("Making Sure there's no left over credential", async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      await page.goto(DATA_DASHBOARD_URL);
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
      await page.getByRole("button", { name: "Connect a wallet" }).click();
      await page.getByRole("button", { name: "Metamask" }).click();

      await metamask.connectToDapp();
      await page.waitForTimeout(2000);
      await metamask.confirmSignature();

      await page.waitForSelector("#credentials-list");
      await page.waitForTimeout(2000);

      const credentialsList = await page.locator("#credentials-list");
      const credentialsCount = await credentialsList.getByRole("listitem").count();

      await page.waitForTimeout(1000);
      for (let index = 0; index < credentialsCount; index++) {
        const credential = await credentialsList.getByRole("listitem").first();
        const sharedCount = await credential.getByTestId("shares-count").textContent();

        const deleteBtn = await credential.getByRole("button", { name: "Delete" });
        await deleteBtn.click();

        const confirmDeleteBtn = page.getByRole("button", { name: "Delete" }).last();
        await confirmDeleteBtn.click();

        for (let index = 0; index < +sharedCount!; index++) {
          await page.waitForTimeout(3500);
          await metamask.confirmSignature();
        }
        await page.waitForTimeout(3500);
        await metamask.confirmSignature();
        await expect(page.getByTestId("delete-credential-dialog")).not.toBeVisible();
      }
      expect(await page.locator("#credentials-list").getByRole("listitem").count()).toBe(0);
    });

    test("No reusable credential found", async ({ context, page, metamaskPage, extensionId }) => {
      await page.goto(PASSPORTING_URL);
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
      await page.getByRole("button", { name: "Connect a wallet" }).click();

      await metamask.connectToDapp();
      await page.waitForTimeout(2000);
      await metamask.confirmSignature();

      const header = await page.locator("h1").first();
      await expect(header).toHaveText("No matching credential found 😔");
      await page.waitForTimeout(3000);
    });

    test("Should issue a credential successfully using OE1", async ({
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
      const pagePromise = context.waitForEvent("page");
      await page.getByRole("button", { name: "Get a new credential" }).click();

      const issuerPage = await pagePromise;
      expect(issuerPage.url()).toContain(ISSUER_DEMO_URL);

      // Heading to Issuer Demo app
      await issuerPage.waitForTimeout(2000);
      await issuerPage.getByRole("button", { name: "Connect a wallet" }).click();
      await metamask.connectToDapp();
      await issuerPage.waitForTimeout(2000);
      await metamask.confirmSignature();

      await issuerPage.getByRole("button", { name: "View credential details" }).first().click();

      const popupPromise = issuerPage.waitForEvent("popup");
      await issuerPage.frameLocator("#idos-enclave-iframe").locator("#unlock").click();
      const idOSPopup = await popupPromise;
      await issuerPage.waitForTimeout(2000);
      await (await idOSPopup.waitForSelector("#auth-method-password")).click();
      const passwordInput = idOSPopup.locator("#idos-password-input");
      await passwordInput.fill("qwerty");
      await idOSPopup.getByRole("button", { name: "Unlock" }).click();

      await issuerPage.getByRole("button", { name: "Close" }).first().click();

      await issuerPage.waitForTimeout(2000);
      await issuerPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await issuerPage
        .getByRole("button", {
          name: "Create a reusable credential (OE1)",
        })
        .first()
        .click();

      await issuerPage.waitForTimeout(3000);
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

      const header = await page.locator("h3").first();
      await expect(header).toHaveText("We have found a matching credential that we can reuse:");
      await page.waitForTimeout(3000);
    });

    test("Request a reusable credential", async ({ context, page, metamaskPage, extensionId }) => {
      await page.goto(PASSPORTING_URL);
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
      await page.getByRole("button", { name: "Connect a wallet" }).click();

      await metamask.connectToDapp();
      await page.waitForTimeout(2000);
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
  });
