import type {
  FaceTecSessionRequestProcessor,
  FaceTecSessionRequestProcessorCallback,
  FaceTecSessionResult,
} from "@/assets/facetec/FaceTecPublicApi.d";
import { isLoginResponse, isNewUserResponse, login } from "@/lib/api";

export type SessionRequestProcessorCallback = (
  result: FaceTecSessionResult,
  lastReceivedAttestationToken?: string,
  lastReceivedNewUserConfirmationToken?: string,
) => void;

export class SessionRequestProcessor implements FaceTecSessionRequestProcessor {
  #lastReceivedAttestationToken: string | undefined = undefined;
  #lastReceivedNewUserConfirmationToken: string | undefined = undefined;
  #callback: SessionRequestProcessorCallback | undefined;

  constructor(callback?: SessionRequestProcessorCallback) {
    this.#callback = callback;
  }

  onSessionRequest = (
    sessionRequestBlob: string,
    sessionRequestCallback: FaceTecSessionRequestProcessorCallback,
  ): void => {
    login(sessionRequestBlob)
      .then((response) => {
        if (isLoginResponse(response)) {
          this.#lastReceivedAttestationToken = response.userAttestmentToken;
        } else if (isNewUserResponse(response)) {
          this.#lastReceivedNewUserConfirmationToken = response.newUserConfirmationToken;
        }

        if (response.responseBlob) {
          this.onResponseBlobReceived(response.responseBlob, sessionRequestCallback);
        } else {
          this.onCatastrophicNetworkError(sessionRequestCallback);
        }
      })
      .catch((error) => {
        console.log("Session request error:", error);
        this.onCatastrophicNetworkError(sessionRequestCallback);
      });
  };

  onResponseBlobReceived = (
    responseBlob: string,
    sessionRequestCallback: FaceTecSessionRequestProcessorCallback,
  ): void => {
    sessionRequestCallback.processResponse(responseBlob);
  };

  onUploadProgress = (
    progress: number,
    sessionRequestCallback: FaceTecSessionRequestProcessorCallback,
  ): void => {
    sessionRequestCallback.updateProgress(progress);
  };

  onCatastrophicNetworkError = (
    sessionRequestCallback: FaceTecSessionRequestProcessorCallback,
  ): void => {
    sessionRequestCallback.abortOnCatastrophicError();
  };

  onFaceTecExit = (faceTecSessionResult: FaceTecSessionResult): void => {
    console.log("DONE");
    this.#callback?.(
      faceTecSessionResult,
      this.#lastReceivedAttestationToken,
      this.#lastReceivedNewUserConfirmationToken,
    );
  };
}
