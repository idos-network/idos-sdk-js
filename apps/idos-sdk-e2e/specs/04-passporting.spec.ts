import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import basicSetup from "../wallet-setup/basic.setup";

const test = testWithSynpress(metaMaskFixtures(basicSetup));

const PASSPORTING_URL = "http://localhost:3000"; // @todo: replace with issuer demo app url

const REUSABLE_CRED_ID = "150b3443-0f86-4d83-b9d5-ec9b2ea0acba";
const MATCHING_CRED_ID = "94c11db5-7b55-464c-a7ba-a33dc468ffef";

const getPassportingUrl = (credId: string) => `${PASSPORTING_URL}/?cred_id=${credId}`;

const { expect } = test;

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(120000);

  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});

test("should issue a credential successfully using OE1", async ({
  context,
  page,
  metamaskPage,
  extensionId,
}) => {
  await page.goto("http://localhost:3001"); // @todo: replace with issuer demo app url
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
  await page.goto("http://localhost:3001"); // @todo: replace with grantee demo app url
  expect(diff.length).toBe(1);
});

test("Having a reusable credential", async ({ context, page, metamaskPage, extensionId }) => {
  await page.goto(getPassportingUrl(REUSABLE_CRED_ID));
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();

  await metamask.connectToDapp();
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();
  await metamask.confirmSignature();

  const popupPromise = page.waitForEvent("popup");
  await page.frameLocator("#idos-enclave-iframe").locator("#unlock").click();
  const idOSPopup = await popupPromise;
  await page.waitForTimeout(2000);
  await (await idOSPopup.waitForSelector("#auth-method-password")).click();
  const passwordInput = idOSPopup.locator("#idos-password-input");
  await passwordInput.fill("qwerty");
  await idOSPopup.getByRole("button", { name: "Unlock" }).click();

  const header = await page.locator("h3").first();
  await expect(header).toHaveText("We have found a a reusable credential:");
  await page.waitForTimeout(3000);
});

test("Having a matching but not reusable credential", async ({
  context,
  page,
  metamaskPage,
  extensionId,
}) => {
  await page.goto(getPassportingUrl(MATCHING_CRED_ID));
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();

  await metamask.connectToDapp();
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();
  await metamask.confirmSignature();

  const popupPromise = page.waitForEvent("popup");
  await page.frameLocator("#idos-enclave-iframe").locator("#unlock").click();
  const idOSPopup = await popupPromise;
  await page.waitForTimeout(2000);
  await (await idOSPopup.waitForSelector("#auth-method-password")).click();
  const passwordInput = idOSPopup.locator("#idos-password-input");
  await passwordInput.fill("qwerty");
  await idOSPopup.getByRole("button", { name: "Unlock" }).click();

  const header = await page.locator("h3").first();
  await expect(header).toHaveText("We have found a matching credential that we can reuse:");
  await page.waitForTimeout(3000);
});

test("request a reusable credential", async ({ context, page, metamaskPage, extensionId }) => {
  await page.goto(getPassportingUrl(MATCHING_CRED_ID));
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();

  await metamask.connectToDapp();
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();
  await metamask.confirmSignature();

  const popupPromise = page.waitForEvent("popup");
  await page.frameLocator("#idos-enclave-iframe").locator("#unlock").click();
  const idOSPopup = await popupPromise;
  await page.waitForTimeout(2000);
  await (await idOSPopup.waitForSelector("#auth-method-password")).click();
  const passwordInput = idOSPopup.locator("#idos-password-input");
  await passwordInput.fill("qwerty");
  await idOSPopup.getByRole("button", { name: "Unlock" }).click();

  const header = await page.locator("h3").first();
  await expect(header).toHaveText("We have found a matching credential that we can reuse:");
  await page.getByRole("button", { name: "Request credential duplicate" }).click();

  expect(await page.locator('button[data-loading="true"]')).toBeVisible();

  // message to be signed
  await metamask.confirmSignature();
  await page.waitForTimeout(2000);

  // share credential tx signature
  await metamask.confirmSignature();

  const newHeader = await page.locator("h3").first();
  await page.waitForTimeout(2000);
  await expect(newHeader).toHaveText("We have found a a reusable credential:");
});
