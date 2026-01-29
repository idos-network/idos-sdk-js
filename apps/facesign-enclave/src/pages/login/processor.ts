// Core

import { login } from "@/lib/api.js";
import type {
  FaceTecSessionRequestProcessor,
  FaceTecSessionRequestProcessorCallback,
  FaceTecSessionResult,
} from "../../assets/facetec/FaceTecPublicApi.js";

export type SessionRequestProcessorCallback = (
  result: FaceTecSessionResult,
  lastReceivedToken?: string,
) => void;

// This is an example self-contained class to perform Liveness Checks with the FaceTec SDK.
// You may choose to further componentize parts of this in your own Apps based on your specific requirements.
//
export class SessionRequestProcessor implements FaceTecSessionRequestProcessor {
  private lastReceivedToken: string | undefined = undefined;

  constructor(private callback?: SessionRequestProcessorCallback) {}

  // The onSessionRequest API is the core method called by the FaceTec SDK when a request needs to be processed by the FaceTec SDK.
  // Your code must retrieve the Session Request Blob and send to your FaceTec Server.
  // Your code must retrieve the Response Blob from FaceTec Server and call processResponse, passing in the Response Blob.
  public onSessionRequest = (
    sessionRequestBlob: string,
    sessionRequestCallback: FaceTecSessionRequestProcessorCallback,
  ): void => {
    login(sessionRequestBlob)
      .then(({ responseBlob, entropyToken }) => {
        this.lastReceivedToken = entropyToken;
        if (responseBlob) {
          this.onResponseBlobReceived(responseBlob, sessionRequestCallback);
        } else {
          this.onCatastrophicNetworkError(sessionRequestCallback);
        }
      })
      .catch((error) => {
        console.log("Session request error:", error);
        this.onCatastrophicNetworkError(sessionRequestCallback);
      });
    // When you receive a Session Request Blob, call your webservice API that handles this object and passes it to FaceTec Server.
    // SampleAppNetworkingRequest is a demonstration class for making a networking call that passes the Session Request Blob, and handles the response.
    // SampleAppNetworkingRequest.send(this, sessionRequestBlob, sessionRequestCallback);
  };

  // When the request blob has been received, send it back to the FaceTecSDK for continued processing
  public onResponseBlobReceived = (
    responseBlob: string,
    sessionRequestCallback: FaceTecSessionRequestProcessorCallback,
  ): void => {
    sessionRequestCallback.processResponse(responseBlob);
  };

  // When upload progress is received from your webservice, call updateProgress to update the Progress Bar state.
  // Please note that onUploadProgress is a convenience function set up on this class,
  // so that this function can be called asynchronously when your networking code receives an upload progress event.
  public onUploadProgress = (
    progress: number,
    sessionRequestCallback: FaceTecSessionRequestProcessorCallback,
  ): void => {
    sessionRequestCallback.updateProgress(progress);
  };

  // Calling abortOnCatastrophicError is not allowed except for catastrophic network failures.
  // Calling abortOnCatastrophicError to exit the FaceTec UI with custom logic is not allowed.
  public onCatastrophicNetworkError = (
    sessionRequestCallback: FaceTecSessionRequestProcessorCallback,
  ): void => {
    sessionRequestCallback.abortOnCatastrophicError();
  };

  // The onFaceTecExit API is the method called when the FaceTec SDK completes or cancels.
  // For demonstration purposes, we are handling next steps in the SampleAppController.
  public onFaceTecExit = (faceTecSessionResult: FaceTecSessionResult): void => {
    console.log("DONE");
    this.callback?.(faceTecSessionResult, this.lastReceivedToken);
  };
}
