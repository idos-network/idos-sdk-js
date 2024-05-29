import { MetaMask, metaMaskFixtures, testWithSynpress } from "@synthetixio/synpress";
import basicSetup from "./wallet-setup/basic.setup";

const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;

test.beforeEach(async ({ context, page }) => {
  test.setTimeout(120000);

  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());
});

test("should create a grant successfully", async ({ context, page, metamaskPage, extensionId }) => {
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).click();
  await metamask.switchAccount("Account 1");
  await metamask.connectToDapp(["Account 1"]);
  await page.waitForTimeout(2000);
  await metamask.confirmSignature();

  const list = page.locator("#credentials-list");

  // Get the credential ID that is going to be shared.
  const credentialId = (await list.getByRole("listitem").first().getAttribute("id")) as string;

  await page.goto("https://idos-example-dapp-plaground.vercel.app/");
  await context.clearCookies();
  await page.evaluate(() => window.localStorage.clear());

  await page.getByRole("checkbox", { name: "Credentials" }).click();

  await page.getByRole("button", { name: "EVM" }).click();
  await metamask.approveSwitchNetwork();
  await metamask.switchAccount("Account 1");
  await metamask.connectToDapp(["Account 1"]);
  await metamask.confirmSignature();

  await page.waitForTimeout(2000);

  await page.getByText(credentialId).click();

  const popupPromise = page.waitForEvent("popup");
  const idOSButton = page.frameLocator("#idos-enclave-iframe").locator("#unlock");
  await idOSButton.click();
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
  const manageGrantsButton = page.locator(`#manage-grants-${credentialId}`);
  await page.goto(process.env.BASE_URL as string);
  await manageGrantsButton.click();

  const revokeButton = page.getByRole("button", { name: "Revoke" }).last();
  // As we created an AG with a timelock of 1 minute, the button should be disabled.
  await expect(revokeButton).toBeDisabled();
});

test("should revoke a grant successfully", async ({ context, page, metamaskPage, extensionId }) => {
  await page.waitForTimeout(70000);
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.getByRole("button", { name: "Connect a wallet" }).click();
  await page.getByRole("button", { name: "Metamask" }).click();

  await metamask.switchAccount("Account 1");
  await metamask.connectToDapp(["Account 1"]);
  await page.waitForTimeout(3000);
  await metamask.confirmSignature();

  const list = page.locator("#credentials-list");

  // Get the credential ID that was shared.
  const credentialId = (await list.getByRole("listitem").first().getAttribute("id")) as string;

  const manageGrantsButton = page.locator(`#manage-grants-${credentialId}`);
  await manageGrantsButton.click();

  await metamask.approveSwitchNetwork();
  const revokeButton = page.getByRole("button", { name: "Revoke" }).last();
  await revokeButton.click();

  await page.waitForTimeout(3000);
  await metamask.confirmSignature();
  await page.waitForTimeout(3000);
  await metamask.confirmTransaction();
  await page.waitForSelector("#no-grants");
  await expect(revokeButton).not.toBeVisible();
  await expect(page.locator(`#grants-for-${credentialId}`)).not.toBeVisible();
});
