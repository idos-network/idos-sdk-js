import { EyeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { Store } from "@idos-network/idos-store";
import { computed, signal } from "@preact/signals";
import { decode as base64Decode, encode as base64Encode } from "@stablelib/base64";
import { Component, type ComponentProps } from "preact";
import nacl from "tweetnacl";

import type { Configuration } from "../pages/App";
import type { AuthMethod, MessageEventDataType } from "../types";
import { idOSKeyDerivation } from "./idOSKeyDerivation";

interface EnclaveMessageEventData {
  target?: string;
  type: MessageEventDataType;
  payload: Record<string, unknown>;
}

function Spinner() {
  return (
    <output>
      <svg
        aria-hidden="true"
        class="h-5 w-5 animate-spin fill-[#00ffb9] text-black dark:text-gray-600"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span class="sr-only">Loading...</span>
    </output>
  );
}

interface ButtonProps extends Omit<ComponentProps<"button">, "class" | "className"> {
  isLoading?: boolean;
}

function Button({ isLoading, ...props }: ButtonProps) {
  return (
    <button
      class="inline-flex h-full w-full place-content-center items-center gap-2 rounded-lg bg-[#00ffb9] px-[5%] py-[2%] font-medium text-[41cqmin] text-zinc-950 transition-colors hover:bg-green-400 disabled:pointer-events-none disabled:opacity-80"
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <Spinner /> : props.children}
    </button>
  );
}

interface EnclaveProps {
  parentOrigin: string;
}

export class Enclave extends Component<EnclaveProps> {
  private userEncryptionPublicKey = "";
  private keyPair: nacl.BoxKeyPair | null = null;
  private readonly parentOrigin = new URL(document.referrer).origin;
  private readonly store = new Store();

  private readonly authorizedOrigins = signal<string[]>(
    JSON.parse(this.store.get("enclave-authorized-origins") ?? "[]"),
  );
  private isAuthorizedOrigin = computed(() =>
    this.authorizedOrigins.value.includes(this.parentOrigin),
  );

  private readonly messagePort = signal<MessagePort>();
  private readonly uiConfig = signal<Configuration>({
    mode: "existing",
  });
  private readonly uiStatusSignal = signal<"idle" | "pending">("idle");
  private readonly publicKeySignal = signal<Uint8Array>();

  constructor(props: EnclaveProps) {
    super(props);
    const secretKey = this.store.get("encryption-private-key");

    if (secretKey) this.keyPair = nacl.box.keyPair.fromSecretKey(base64Decode(secretKey));

    this.listenToRequests();
  }

  private async launchEnclaveAppAuth() {
    const preferredAuthMethod: AuthMethod = this.store.get("preferred-auth-method");
    const humanId = this.store.get("human-id");

    const url = new URL(`${window.location.origin}/auth`, window.location.origin);

    url.searchParams.set("mode", this.uiConfig.value.mode ?? "existing");

    url.searchParams.set("humanId", humanId);

    if (preferredAuthMethod) url.searchParams.set("method", preferredAuthMethod);

    if (preferredAuthMethod === "password")
      url.searchParams.set("pubKey", this.userEncryptionPublicKey);

    const width = 600;
    const height = this.uiConfig.value.mode === "new" ? 600 : 400;
    const left = window.screen.width - width;

    const popupConfig = Object.entries({
      height,
      left,
      top: 0,
      popup: 1,
      width,
    })
      .map((feat) => feat.join("="))
      .join(",");

    const dialog = window.open(url, "idOS-dialog", popupConfig);

    if (!dialog) throw new Error("Failed to open idOS Enclave dialog");

    await new Promise((resolve) =>
      dialog.addEventListener("secure-enclave:ready", resolve, { once: true }),
    );

    const abortController = new AbortController();

    return new Promise<{ password: string; duration: number }>((resolve, reject) => {
      const channel = new MessageChannel();

      dialog.addEventListener(
        "beforeunload",
        () => {
          channel.port1.close();
          this.uiStatusSignal.value = "idle";

          reject(new Error("idOS Enclave dialog closed by user"));
        },
        { signal: abortController.signal },
      );

      channel.port1.onmessage = ({ data: { error, result } }) => {
        abortController.abort();
        channel.port1.close();
        dialog.close();

        if (error) return reject(error);

        return resolve(result);
      };

      dialog.postMessage(
        {
          type: "secure-enclave:load",
          payload: this.uiConfig.value,
        },
        dialog.origin,
        [channel.port2],
      );
    });
  }

  private configure(config: Configuration) {
    this.uiConfig.value = { ...this.uiConfig.value, ...config };
  }

  private getStoredValues() {
    // if (!this.isAuthorizedOrigin.value) {
    //   return {
    //     humanId: "",
    //     encryptionPublicKey: "",
    //     signerAddress: "",
    //     signerPublicKey: "",
    //   };
    // }

    const storeWithCodec = this.store.pipeCodec({
      // biome-ignore lint/suspicious/noExplicitAny: Fix later types in idOS-store
      encode: base64Encode as any,
      // biome-ignore lint/suspicious/noExplicitAny: Fix later types in idOS-store
      decode: base64Decode as any,
    });

    return {
      humanId: this.store.get("human-id"),
      encryptionPublicKey: storeWithCodec.get("encryption-public-key"),
      signerAddress: this.store.get("signer-address"),
      signerPublicKey: this.store.get("signer-public-key"),
    };
  }

  private storeValues(values: Record<string, string>) {
    this.store.set("human-id", values.humanId);
    this.store.set("signer-address", values.signerAddress);
    this.store.set("signer-public-key", values.signerPublicKey);
    this.userEncryptionPublicKey = values.expectedUserEncryptionPublicKey;
  }

  private async deriveKeyPairFromPassword(password: string) {
    const salt = this.store.get("human-id");
    const storeWithCodec = this.store.pipeCodec({
      // biome-ignore lint/suspicious/noExplicitAny: @todo: fix types in idOS-store
      encode: base64Encode as any,
      // biome-ignore lint/suspicious/noExplicitAny: @todo: fix types in idOS-store
      decode: base64Decode as any,
    });

    const secretKey =
      storeWithCodec.get("encryption-private-key") || (await idOSKeyDerivation({ password, salt }));

    this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

    storeWithCodec.set("encryption-private-key", this.keyPair.secretKey);
    storeWithCodec.set("encryption-public-key", this.keyPair.publicKey);

    return this.keyPair.publicKey;
  }

  private async handleAuth() {
    try {
      this.uiStatusSignal.value = "pending";
      const { password, duration } = await this.launchEnclaveAppAuth();

      this.store.setRememberDuration(duration);
      this.store.set("password", password);
      this.store.set("preferred-auth-method", "password");

      this.publicKeySignal.value = await this.deriveKeyPairFromPassword(password);
    } catch (error) {
      console.error(error);
    }
  }

  private async decrypt(message: Uint8Array, senderPublicKey: Uint8Array) {
    if (!this.keyPair) throw new Error("Unable to decrypt. No secret key found.");

    const nonce = message.slice(0, nacl.box.nonceLength);
    const slicedMessage = message.slice(nacl.box.nonceLength, message.length);
    const result = nacl.box.open(slicedMessage, nonce, senderPublicKey, this.keyPair.secretKey);

    if (result === null) throw new Error("Failed to decrypt message");

    return result;
  }

  private listenToRequests() {
    window.addEventListener("message", async (event: MessageEvent<EnclaveMessageEventData>) => {
      if (event.origin !== this.props.parentOrigin || event.data.target === "metamask-inpage")
        return;

      this.messagePort.value = event.ports[0];

      const type = event.data.type;

      switch (type) {
        case "secure-enclave:load": {
          this.configure(event.data.payload as Configuration);
          this.messagePort.value.postMessage({
            type,
          });
          break;
        }
        case "storage:get": {
          const values = this.getStoredValues();
          this.messagePort.value.postMessage({ type, result: values });
          break;
        }
        case "storage:set": {
          this.storeValues(event.data.payload as Record<string, string>);
          const values = this.getStoredValues();
          this.messagePort.value.postMessage({ type, result: values });
          break;
        }
        case "public-key:get": {
          const { encryptionPublicKey } = this.getStoredValues();
          this.messagePort.value.postMessage({
            type,
            result: { encryptionPublicKey },
          });
          break;
        }
        case "keypair:get": {
          const unsubscribe = this.publicKeySignal.subscribe((publicKey) => {
            if (publicKey && this.messagePort.value) {
              this.messagePort.value.postMessage({
                type,
                result: { publicKey },
              });
              unsubscribe();
            }
          });
          break;
        }
        case "decrypt": {
          const result = await this.decrypt(
            event.data.payload.message as Uint8Array,
            event.data.payload.senderPublicKey as Uint8Array,
          );
          this.messagePort.value.postMessage({
            type,
            result,
          });
          break;
        }
      }
    });
  }

  render() {
    return (
      <div class="flex h-dvh flex-col place-content-center items-center gap-5">
        {this.uiConfig.value?.mode === "existing" ? (
          <Button
            id="unlock"
            onClick={() => this.handleAuth()}
            isLoading={this.uiStatusSignal.value === "pending"}
          >
            <LockClosedIcon class="h-5 w-5" />
            Unlock idOS
          </Button>
        ) : (
          <Button id="confirm" isLoading={this.uiStatusSignal.value === "pending"}>
            <EyeIcon class="h-5 w-5" /> See request
          </Button>
        )}
      </div>
    );
  }
}
