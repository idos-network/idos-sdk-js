import {
  CallBody,
  NamedParams,
  resolveParamTypes,
  transformActionInput,
  transformPositionalParam,
} from "../core/action";
import {
  AuthSuccess,
  AuthenticatedBody,
  KGWAuthInfo,
  LogoutResponse,
  composeAuthMsg,
  generateSignatureText,
  removeTrailingSlash,
  verifyAuthProperties,
} from "../core/auth";
import { BytesEncodingStatus, EnvironmentType, PayloadType } from "../core/enums";
import { KwilSigner } from "../core/kwilSigner";
import { UnencodedActionPayload } from "../core/payload";
import { GenericResponse } from "../core/resreq";
import { AuthBody, executeSign } from "../core/signature";
import { base64ToBytes, bytesToBase64 } from "../utils/base64";
import { sha256BytesToBytes } from "../utils/crypto";
import { encodeActionCall } from "../utils/kwilEncoding";
import { objects } from "../utils/objects";
import { encodeValueType } from "../utils/parameterEncoding";
import { bytesToHex, hexToBytes, stringToBytes } from "../utils/serial";

interface AuthClient {
  getAuthenticateClient(): Promise<GenericResponse<KGWAuthInfo>>;
  postAuthenticateClient<T extends EnvironmentType>(
    body: AuthenticatedBody<BytesEncodingStatus.HEX_ENCODED>,
  ): Promise<GenericResponse<AuthSuccess<T>>>;
  logoutClient<T extends EnvironmentType>(
    identifier?: Uint8Array,
  ): Promise<GenericResponse<LogoutResponse<T>>>;
  challengeClient(): Promise<GenericResponse<string>>;
}

export class Auth<T extends EnvironmentType> {
  private authClient: AuthClient;
  private kwilProvider: string;
  private chainId: string;

  public constructor(authClient: AuthClient, kwilProvider: string, chainId: string) {
    this.authClient = authClient;
    this.kwilProvider = kwilProvider;
    this.chainId = chainId;
  }

  /**
   * Authenticates a user with the Kwil Gateway (KGW). This is required to execute view actions with the `@kgw(authn='true')` annotation.
   *
   * This method should only be used if your Kwil Network is using the Kwil Gateway.
   *
   * @param {KwilSigner} signer - The signer for the authentication.
   * @returns A promise that resolves to the authentication success or failure.
   */
  public async authenticateKGW(signer: KwilSigner): Promise<GenericResponse<AuthSuccess<T>>> {
    // KGW rpc call
    const authParam = await this.authClient.getAuthenticateClient();

    const authProperties = objects.requireNonNil(
      authParam.data,
      "something went wrong retrieving auth info from KGW",
    );

    const domain = removeTrailingSlash(this.kwilProvider);
    const version = "1";

    verifyAuthProperties(authProperties, domain, version, this.chainId);

    const msg = composeAuthMsg(authProperties, domain, version, this.chainId);

    const signature = await executeSign(stringToBytes(msg), signer.signer, signer.signatureType);

    const authBody: AuthenticatedBody<BytesEncodingStatus.HEX_ENCODED> = {
      nonce: authProperties.nonce,
      sender: bytesToHex(signer.identifier),
      signature: {
        sig: bytesToBase64(signature),
        type: signer.signatureType,
      },
    };

    // KGW rpc call
    const res = await this.authClient.postAuthenticateClient(authBody);

    return res;
  }

  /**
   * Authenticates a user in private mode.
   *
   * This method should only be used if your Kwil Network is in private mode.
   *
   * @param {KwilSigner} signer - The signer for the authentication.
   * @param {CallBody} callBody - The body of the action to send. This should use the `ActionBody` interface.
   * @returns A promise that resolves a privateSignature => privateSignature = {sig: string (Base64), type: AnySignatureType}
   */

  public async authenticatePrivateMode(callBody: CallBody, signer: KwilSigner): Promise<AuthBody> {
    // get Challenge
    const challenge = await this.authClient.challengeClient();
    let msgChallenge = challenge.data as string;

    // Check if challenge.data is undefined
    if (!msgChallenge) {
      throw new Error("Challenge data is undefined. Something went wrong.");
    }

    // ActionInput[] is deprecated. So we are converting any ActionInput[] to an Entries[]
    let inputs: NamedParams = {};
    if (callBody.inputs && transformActionInput.isActionInputArray(callBody.inputs)) {
      // For a call only one entry is allowed, so we only need to convert the first ActionInput
      inputs = transformActionInput.toSingleEntry(callBody.inputs);
    } else if (callBody.inputs && transformPositionalParam.isPositionalParam(callBody.inputs)) {
      inputs = transformPositionalParam.toNamedParam(callBody.inputs);
    } else if (callBody.inputs) {
      inputs = callBody.inputs;
    }

    const actionValues = callBody?.inputs ? Object.values(inputs) : [];
    const value = resolveParamTypes(actionValues, callBody?.types);

    // construct payload. If there are no prepared actions, then the payload is an empty array.
    const payload: UnencodedActionPayload<PayloadType.CALL_ACTION> = {
      dbid: callBody.namespace,
      action: callBody.name,
      arguments: encodeValueType(value),
    };

    const encodedPayload = encodeActionCall(payload);
    const uInt8ArrayPayload = base64ToBytes(encodedPayload);

    const digest = sha256BytesToBytes(uInt8ArrayPayload).subarray(0, 20);
    const msg = generateSignatureText(
      callBody.namespace,
      callBody.name,
      bytesToHex(digest),
      msgChallenge,
    );

    const signature = await executeSign(stringToBytes(msg), signer.signer, signer.signatureType);
    const sig = bytesToBase64(signature);

    const byteChallenge = hexToBytes(msgChallenge);
    const base64Challenge = bytesToBase64(byteChallenge); // Challenge needs to be Base64 in the message

    const res = {
      signature: sig,
      challenge: base64Challenge,
    };

    return res;
  }

  public async logoutKGW(signer?: KwilSigner): Promise<GenericResponse<LogoutResponse<T>>> {
    const identifier = signer?.identifier || undefined;
    return await this.authClient.logoutClient(identifier);
  }
}
