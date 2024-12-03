import { MetaMask, metaMaskFixtures, testWithSynpress } from "@synthetixio/synpress";
import basicSetup from "./wallet-setup/basic.setup";

const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(500000);

  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});

test("should create a grant successfully", async ({ context, page, metamaskPage, extensionId }) => {
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).first().click();
  await metamask.switchAccount("Account 1");
  await metamask.connectToDapp(["Account 1"]);
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();

  const list = page.locator("#credentials-list");

  await page.goto(process.env.GRANTS_TEST_BASE_URL as string);
  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());

  await page.getByRole("checkbox", { name: "Credentials" }).click();

  await page.getByRole("button", { name: "EVM" }).click();
  await metamask.approveSwitchNetwork();
  await metamask.switchAccount("Account 1");
  await metamask.connectToDapp(["Account 1"]);
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();
  await page.waitForTimeout(2000);

  const credentialId = process.env.CREDENTIAL_ID as string;
  await page.getByText(credentialId).click();

  // We setup the popupPromise before clicking the button to open the popup.
  // See https://playwright.dev/docs/pages#handling-popups for more information about how to handle popups.
  const popupPromise = page.waitForEvent("popup");
  const idOSButton = page.frameLocator("#idos-enclave-iframe").locator("#unlock");
  await idOSButton.click();
  // Then we await the popupPromise to get the popup page.
  const idOSPopup = await popupPromise;
  await page.waitForTimeout(2000);
  await (await idOSPopup.waitForSelector("#auth-method-password")).click();
  const passwordInput = idOSPopup.locator("#idos-password-input");
  await passwordInput.fill("qwerty");
  await idOSPopup.getByRole("button", { name: "Unlock" }).click();

  // Timelock the grant for 1 minute.
  page.on("dialog", async (dialog) => {
    await dialog.accept("60");
  });

  // Share the credential
  await page.locator(`#acquire-access-grant-${credentialId}`).click();

  await metamask.confirmSignature();
  await page.waitForTimeout(2000);
  await metamask.confirmTransaction();

  await (await page.waitForSelector(`#restart-${credentialId}`)).waitForElementState("visible");

  // Navigate back and check for the grant creation
  await page.goto(process.env.BASE_URL as string);
  await metamask.confirmSignature();
  const manageGrantsButton = page.locator(`#manage-grants-${credentialId}`);
  await manageGrantsButton.click();

  const revokeButton = page.getByRole("button", { name: "Revoke" }).last();
  // As we created an AG with a timelock of 1 minute, the button should be disabled.
  await expect(revokeButton).toBeDisabled();
});

test("should revoke a grant successfully", async ({ context, page, metamaskPage, extensionId }) => {
  await page.waitForTimeout(50000);
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).first().click();

  await metamask.switchAccount("Account 1");
  await metamask.connectToDapp(["Account 1"]);
  await page.waitForTimeout(3000);
  await metamask.confirmSignature();

  const list = page.locator("#credentials-list");
  const credentialId = process.env.CREDENTIAL_ID as string;
  const manageGrantsButton = page.locator(`#manage-grants-${credentialId}`);
  await manageGrantsButton.click();
  await metamask.approveSwitchNetwork();
  await page.reload();
  await manageGrantsButton.click();

  const revokeButton = page.getByRole("button", { name: "Revoke" }).first();
  await revokeButton.click();

  await page.waitForTimeout(3000);
  await metamask.confirmSignature();
  await page.waitForTimeout(3000);
  await metamask.confirmTransaction();
  await page.waitForSelector("#no-grants");
  await expect(revokeButton).not.toBeVisible();
  await expect(page.locator(`#grants-for-${credentialId}`)).not.toBeVisible();
});

test("should share a matching credential successfully", async ({
  context,
  page,
  metamaskPage,
  extensionId,
}) => {
  await page.goto("/e2e/credential-filtering");
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).first().click();
  await metamask.switchAccount("Account 1");
  await metamask.connectToDapp(["Account 1"]);
  await page.waitForTimeout(3000);
  await metamask.confirmSignature();
  await page.waitForTimeout(3000);
  const popupPromise = page.waitForEvent("popup");

  const switchChainBtn = page.locator("#switch-chain-button");
  await switchChainBtn.click();
  await metamask.approveSwitchNetwork();
  await page.waitForTimeout(3000);

  await page.reload();

  const shareBtn = page.locator("#share-matching-credential-button");
  await shareBtn.click();

  const idOSButton = page.frameLocator("#idos-enclave-iframe").locator("#unlock");
  await idOSButton.click();
  const idOSPopup = await popupPromise;
  await page.waitForTimeout(2000);
  await (await idOSPopup.waitForSelector("#auth-method-password")).click();
  const passwordInput = idOSPopup.locator("#idos-password-input");
  await passwordInput.fill("qwerty");
  await idOSPopup.getByRole("button", { name: "Unlock" }).click();

  await page.waitForTimeout(3000);
  await metamask.confirmSignature();
  await page.waitForTimeout(3000);
  await metamask.confirmTransaction();
  await page.waitForTimeout(3000);
  await (await page.waitForSelector("#transaction")).waitForElementState("visible");
  await expect(page.locator("#transaction-id")).toBeVisible();
});
