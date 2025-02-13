import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import basicSetup from "../wallet-setup/basic.setup";

const test = testWithSynpress(metaMaskFixtures(basicSetup));

// This will work after issuer versel app be pointed to env node with new delegated write grant feature
const ISSUER_DEMO_URL = "https://issuer-sdk-demo.vercel.app/";

const { expect } = test;

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(120000);

  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});

test.describe
  .serial("Issuer creates credentials by delegated write grant", () => {
    test("Create credentials by delegated write grant", async ({
      context,
      page,
      metamaskPage,
      extensionId,
    }) => {
      await page.goto(ISSUER_DEMO_URL);
      const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
      await page.getByRole("button", { name: "Connect a wallet" }).click();

      await metamask.connectToDapp();
      await page.waitForTimeout(2000);
      await metamask.confirmSignature();

      await page.waitForTimeout(2000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page
        .getByRole("button", {
          name: "Via Write Grant",
        })
        .click();
      await page.waitForTimeout(2000);
      await metamask.confirmSignature(); // User signs delegated writ grant message

      const buttonLocator = await page.getByRole("button", {
        name: "Revoke",
      });
      await buttonLocator.waitFor();
      expect(buttonLocator).toHaveCount(1);
      await buttonLocator.click();
    });
  });
