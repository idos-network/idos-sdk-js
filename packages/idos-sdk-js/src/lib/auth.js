import * as Base64Codec from "@stablelib/base64";
import * as BinaryCodec from "@stablelib/binary";
import * as BytesCodec from "@stablelib/bytes";
import * as Utf8Codec from "@stablelib/utf8";
import * as BorshCodec from "borsh";
import { SigningKey, hashMessage } from "ethers";

export class Auth {
  constructor(idOS) {
    this.idOS = idOS;
    this.user = {};
  }

  async setEvmSigner(signer) {
    const storedAddress = this.idOS.store.get("signer-address", signer.address);
    const currentAddress = signer.address;

    let publicKey = this.idOS.store.get("signer-public-key");

    if (storedAddress != currentAddress || !publicKey || !this.idOS.store.get("human-id")) {
      this.idOS.store.reset();
      await this.idOS.enclave.reset();
      const message = "idOS authentication";
      publicKey = SigningKey.recoverPublicKey(hashMessage(message), await signer.signMessage(message));
    }

    this.idOS.store.set("signer-public-key", publicKey);
    this.idOS.store.set("signer-address", currentAddress);

    return this.#setSigner({ signer, publicKey, signatureType: "secp256k1_ep" });
  }

  async setNearSigner(wallet, recipient = "idos.network") {
    if (wallet.id === "my-near-wallet") {
      wallet.signMessageOriginal = wallet.signMessage.bind(wallet);
      wallet.signMessage = async ({ message, recipient }) => {
        const { signature, publicKey, error } =
          Object.fromEntries(
            new URLSearchParams(window.location.hash.slice(1)).entries(),
          );

        if (error) return Promise.reject();

        const lastMessage = this.idOS.store.get("sign-last-message");
        if (signature && message === lastMessage) {
          const nonce = Buffer.from(this.idOS.store.get("sign-last-nonce"));
          const callbackUrl = this.idOS.store.get("sign-last-url");

          return Promise.resolve({
            publicKey,
            signature,
            nonce,
            message,
            callbackUrl,
          });
        } else {
          const callbackUrl = window.location.href;
          const nonce = Buffer.from(
            this.idOS.crypto.Nonce.random(32, { bitCap: 7 }),
          );

          this.idOS.store.set("sign-last-message", message);
          this.idOS.store.set("sign-last-nonce", Array.from(nonce));
          this.idOS.store.set("sign-last-url", callbackUrl);

          wallet.signMessageOriginal({ message, nonce, recipient, callbackUrl });

          await new Promise(() => {});
        }
      };
    }

    const storedAddress = this.idOS.store.get("signer-address");
    const currentAddress = (await wallet.getAccounts())[0].accountId;

    let publicKey = this.idOS.store.get("signer-public-key");

    if (storedAddress != currentAddress || !publicKey || !this.idOS.store.get("human-id")) {
      this.idOS.store.reset();
      await this.idOS.enclave.reset();
      const message = "idOS authentication";
      const nonce = Buffer.from(this.idOS.crypto.Nonce.random(32));
      ({ publicKey } = await wallet.signMessage({ message, recipient, nonce }));

      this.idOS.store.set("signer-public-key", publicKey);
    }

    this.idOS.store.set("signer-address", currentAddress);

    const signer = async (message) => {
      message = Utf8Codec.decode(message);

      let nonceSuggestion = Buffer.from(this.idOS.crypto.Nonce.random(32));

      const {
        nonce = nonceSuggestion,
        signature,
        callbackUrl,
      } = await wallet.signMessage({
        message,
        recipient,
        nonce: nonceSuggestion,
      });

      const nep413BorschSchema = {
        struct: {
          tag: "u32",
          message: "string",
          nonce: { array: { type: "u8", len: 32 } },
          recipient: "string",
          callbackUrl: { option: "string" },
        },
      };

      const nep413BorshParams = {
        tag: 2147484061,
        message,
        nonce: Array.from(nonce),
        recipient,
        callbackUrl,
      };

      const nep413BorshPayload = BorshCodec.serialize(
        nep413BorschSchema,
        nep413BorshParams,
      );

      return BytesCodec.concat(
        BinaryCodec.writeUint16BE(nep413BorshPayload.length),
        nep413BorshPayload,
        Base64Codec.decode(signature),
      );
    };

    return this.#setSigner({ accountId: currentAddress, signer, publicKey, signatureType: "nep413" });
  }

  #setSigner(args) {
    this.idOS.kwilWrapper.setSigner(args);
    return args;
  }

  async currentUser() {
    if (this.user.humanId !== null) {
      const currentUserKeys = ["human-id", "signer-address", "signer-public-key"];
      let [humanId, address, publicKey] =
        currentUserKeys.map(this.idOS.store.get.bind(this.idOS.store));

      humanId = humanId || await this.idOS.kwilWrapper.getHumanId();

      this.user = { humanId, address, publicKey };
      this.idOS.store.set("human-id", humanId);
    }

    return this.user;
  }
}
