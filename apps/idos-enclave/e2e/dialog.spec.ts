import { keyDerivation } from "@idos-network/utils/encryption";
import { expect, test } from "@playwright/test";
import { encode } from "@stablelib/base64";
import nacl from "tweetnacl";

const userId = "9f51b3b2-4cbe-4c2b-8ea3-0b0c1b2f1a11";
const password = "dialog regression test password";
const dappOrigin = "http://dapp.test";
const attackerOrigin = "http://attacker.test";

for (const navigateOpener of [false, true]) {
  test(
    navigateOpener
      ? "rejects a replacement reply port after the opener navigates to another origin"
      : "returns the password through the trusted opener's reply port",
    async ({ context, page, baseURL }) => {
      const enclaveOrigin = new URL(baseURL!).origin;
      const openerURL = `${enclaveOrigin}/test-opener.html`;
      const secretKey = await keyDerivation(password, userId);
      const request = {
        intent: "getPasswordContext",
        message: {
          allowedEncryptionStores: ["user"],
          encryptionPasswordStore: "user",
          expectedUserEncryptionPublicKey: encode(
            nacl.box.keyPair.fromSecretKey(secretKey).publicKey,
          ),
        },
        configuration: { mode: "existing" },
      };

      await context.route(`${dappOrigin}/`, (route) =>
        route.fulfill({
          contentType: "text/html",
          body: `<iframe id="enclave" src="${openerURL}"></iframe>
            <pre id="trusted-result"></pre><pre id="attacker-result"></pre>`,
        }),
      );
      await context.route(openerURL, (route) =>
        route.fulfill({ contentType: "text/html", body: '<button id="open">Unlock</button>' }),
      );
      await context.route(`${attackerOrigin}/`, (route) =>
        route.fulfill({ contentType: "text/html", body: "<p>Replacement opener</p>" }),
      );

      await page.goto(`${dappOrigin}/`);
      await page.evaluate(
        ({ enclaveOrigin, attackerOrigin }) => {
          window.addEventListener("message", (event) => {
            if (event.origin === enclaveOrigin && event.data === "trusted-port") {
              // Test instrumentation: retain the legitimate endpoint outside the
              // opener so its destruction cannot make a rejected attack pass silently.
              const port = event.ports[0];
              port.onmessage = ({ data }) => {
                document.querySelector("#trusted-result")!.textContent = JSON.stringify(data);
                port.close();
              };
              document.body.dataset.trustedPortReady = "true";
            }
            if (event.origin === attackerOrigin && event.data.type === "attacker-result") {
              document.querySelector("#attacker-result")!.textContent = JSON.stringify(
                event.data.result,
              );
            }
          });
        },
        { enclaveOrigin, attackerOrigin },
      );

      const openButton = page.frameLocator("#enclave").locator("#open");
      await openButton.evaluate(
        (button, { request, userId, dappOrigin }) => {
          button.addEventListener("click", () => {
            const dialog = window.open(`/dialog.html?userId=${userId}`, "idos-dialog");
            if (!dialog) throw new Error("Dialog popup was blocked");
            dialog.addEventListener(
              "idOS-Enclave:ready",
              () => {
                const { port1, port2 } = new MessageChannel();
                window.parent.postMessage("trusted-port", dappOrigin, [port1]);
                dialog.postMessage(request, window.origin, [port2]);
              },
              { once: true },
            );
          });
        },
        { request, userId, dappOrigin },
      );
      const popupPromise = page.waitForEvent("popup");
      await openButton.click();
      const popup = await popupPromise;
      await expect(popup.locator("#idos-password-input")).toBeVisible();
      await expect(page.locator("body")).toHaveAttribute("data-trusted-port-ready", "true");

      if (navigateOpener) {
        await popup.evaluate((attackerOrigin) => {
          window.addEventListener("message", (event) => {
            if (event.origin !== attackerOrigin) return;
            document.body.dataset.forgedMessage = JSON.stringify({
              origin: event.origin,
              sameOpener: event.source === window.opener,
              ports: event.ports.length,
            });
          });
        }, attackerOrigin);

        await page.locator("#enclave").evaluate((iframe: HTMLIFrameElement, url) => {
          iframe.src = url;
        }, `${attackerOrigin}/`);
        const replacement = page.frameLocator("#enclave").getByText("Replacement opener");
        await replacement.evaluate(
          (_element, { request, enclaveOrigin, dappOrigin }) => {
            const dialog = window.open("", "idos-dialog");
            if (!dialog) throw new Error("Named dialog lookup failed");
            const { port1, port2 } = new MessageChannel();
            port1.onmessage = ({ data }) => {
              window.parent.postMessage({ type: "attacker-result", result: data }, dappOrigin);
            };
            dialog.postMessage(request, enclaveOrigin, [port2]);
          },
          { request, enclaveOrigin, dappOrigin },
        );

        // Prove the forged message arrived at the real dialog from the same
        // WindowProxy. Only its origin distinguishes it from the trusted opener.
        await expect(popup.locator("body")).toHaveAttribute(
          "data-forged-message",
          JSON.stringify({ origin: attackerOrigin, sameOpener: true, ports: 1 }),
        );
      }

      await popup.locator("#idos-password-input").fill(password);
      await popup.getByRole("button", { name: "Unlock", exact: true }).click();

      // Wait for either port to receive a response so the vulnerable version
      // fails on password delivery to the attacker, rather than on a timeout.
      await expect
        .poll(() => page.locator("#trusted-result, #attacker-result").allTextContents())
        .not.toEqual(["", ""]);
      await expect(page.locator("#attacker-result")).toBeEmpty();
      await expect(page.locator("#trusted-result")).toHaveText(
        JSON.stringify({ result: { encryptionPasswordStore: "user", password, duration: 7 } }),
      );
    },
  );
}
