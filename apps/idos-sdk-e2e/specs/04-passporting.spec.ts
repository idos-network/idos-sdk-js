import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import basicSetup from "../wallet-setup/basic.setup";

const test = testWithSynpress(metaMaskFixtures(basicSetup));

const { expect } = test;

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
  await page.goto("https://localhost:3000"); // @todo: replace with issuer demo app url
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();

  await metamask.connectToDapp();
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();

  const popupPromise = page.waitForEvent("popup");

  page.locator("#view-details-btn").first().click();
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
  await page.goto("http://localhost:3001"); // @todo: replace with grantee demo app url

  console.log({ diff });
});
