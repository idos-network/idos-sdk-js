import { BytesEncodingStatus } from "../../../src/core/enums";
import { BaseMessage, Message, Msg } from "../../../src/core/message";
import { SignatureType } from "../../../src/core/signature";

describe("Message class methods with signature should all work", () => {
  let msg: Message;

  test("Message constructor should work", () => {
    msg = new BaseMessage({
      body: {
        payload: "payload",
      },
      auth_type: SignatureType.SECP256K1_PERSONAL,
      sender: "sender",
      signature: "signature_bytes",
    });
    expect(msg).toBeDefined();
  });

  test("Message body getter should work", () => {
    expect(msg.body).toBeDefined();
  });

  test("Message signature getter should work", () => {
    expect(msg.signature).toBe("signature_bytes");
  });

  test("Message sender getter should work", () => {
    expect(msg.sender).toBe("sender");
  });

  test("Message auth_type getter should work", () => {
    expect(msg.auth_type).toBe(SignatureType.SECP256K1_PERSONAL);
  });
});

describe("Msg namespace functions with signature should all work as expected", () => {
  let msg: Message;

  test("Msg.create should work", () => {
    msg = Msg.create((msg) => {
      msg.body.payload = "payload";
      msg.sender = "sender";
    });
    expect(msg.body.payload).toEqual("payload");
    expect(msg.sender).toEqual("sender");
    expect(msg.signature).toBeNull();
    expect(msg.auth_type).toBe(SignatureType.SECP256K1_PERSONAL);
  });

  test("Msg.copy should work", () => {
    // Given a Message instance 'msg' from the previous test

    // Using the Msg.copy function to set the signature
    const copiedMsg = Msg.copy(msg, (msg) => {
      msg.signature = "signature_bytes";
      msg.auth_type = SignatureType.SECP256K1_PERSONAL;
    });

    // Instead of using a deep equality check, we'll validate individual properties
    expect(copiedMsg.body.payload).toEqual("payload");
    expect(copiedMsg.sender).toEqual("sender");
    expect(copiedMsg.signature).toEqual("signature_bytes");
    expect(copiedMsg.auth_type).toEqual(SignatureType.SECP256K1_PERSONAL);
  });
});
