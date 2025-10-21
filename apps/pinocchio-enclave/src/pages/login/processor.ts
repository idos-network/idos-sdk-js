// Core
import { env } from "@/env.js";
import type {
  FaceTecFaceScanProcessor,
  FaceTecFaceScanResultCallback,
  FaceTecSessionResult,
} from "../../../public/facetec/FaceTecSDK.js/FaceTecPublicApi.js";

// FaceTecSDK is loaded as a global variable via script tag
declare global {
  const FaceTecSDK: any;
}

//
// This is an example self-contained class to perform Liveness Checks with the FaceTec SDK.
// You may choose to further componentize parts of this in your own Apps based on your specific requirements.
//
export class LivenessCheckProcessor implements FaceTecFaceScanProcessor {
  private cancelledDueToNetworkError: boolean;
  latestNetworkRequest: XMLHttpRequest = new XMLHttpRequest();
  public latestSessionResult: FaceTecSessionResult | null;
  private lastNetworkErrorMessage: string | null;
  private token: string | undefined = undefined;

  //
  // DEVELOPER NOTE:  These properties are for demonstration purposes only so the Sample App can get information about what is happening in the processor.
  // In the code in your own App, you can pass around signals, flags, intermediates, and results however you would like.
  //
  success: boolean;

  callback: (status: boolean, token?: string, errorMessage?: string) => void;

  constructor(
    sessionToken: string,
    callback: (status: boolean, token?: string, errorMessage?: string) => void,
  ) {
    //
    // DEVELOPER NOTE:  These properties are for demonstration purposes only so the Sample App can get information about what is happening in the processor.
    // In the code in your own App, you can pass around signals, flags, intermediates, and results however you would like.
    //
    this.success = false;
    this.latestSessionResult = null;
    this.cancelledDueToNetworkError = false;
    this.lastNetworkErrorMessage = null;

    // Set a callback
    this.callback = callback;

    //
    // Part 1:  Starting the FaceTec Session
    //
    // Required parameters:
    // - FaceTecFaceScanProcessor:  A class that implements FaceTecFaceScanProcessor, which handles the FaceScan when the User completes a Session.  In this example, "this" implements the class.
    // - sessionToken:  A valid Session Token you just created by calling your API to get a Session Token from the Server SDK.
    //
    new FaceTecSDK.FaceTecSession(this, sessionToken);
  }

  //
  // Part 2:  Handling the Result of a FaceScan
  //
  public processSessionResultWhileFaceTecSDKWaits = (
    sessionResult: FaceTecSessionResult,
    faceScanResultCallback: FaceTecFaceScanResultCallback,
  ): void => {
    // Save the current sessionResult
    this.latestSessionResult = sessionResult;
    this.lastNetworkErrorMessage = null;
    this.token = undefined;

    //
    // Part 3:  Handles early exit scenarios where there is no FaceScan to handle -- i.e. User Cancellation, Timeouts, etc.
    //
    if (sessionResult.status !== FaceTecSDK.FaceTecSessionStatus.SessionCompletedSuccessfully) {
      this.latestNetworkRequest.abort();
      faceScanResultCallback.cancel();
      return;
    }

    // IMPORTANT:  FaceTecSDK.FaceTecSessionStatus.SessionCompletedSuccessfully DOES NOT mean the Liveness Check was Successful.
    // It simply means the User completed the Session and a 3D FaceScan was created.  You still need to perform the Liveness Check on your Servers.

    //
    // Part 4:  Get essential data off the FaceTecSessionResult
    //
    const parameters = {
      faceScan: sessionResult.faceScan,
      auditTrailImage: sessionResult.auditTrail[0],
      lowQualityAuditTrailImage: sessionResult.lowQualityAuditTrail[0],
      sessionId: sessionResult.sessionId,
      deviceKey: env.VITE_FACETEC_DEVICE_KEY_IDENTIFIER,
      userAgent: FaceTecSDK.createFaceTecAPIUserAgentString(sessionResult.sessionId as string),
    };

    //
    // Part 5:  Make the Networking Call to Your Servers.  Below is just example code, you are free to customize based on how your own API works.
    //
    this.latestNetworkRequest = new XMLHttpRequest();
    this.latestNetworkRequest.open("POST", "https://facesign.staging.sandbox.fractal.id/login");
    this.latestNetworkRequest.setRequestHeader("Content-Type", "application/json");

    this.latestNetworkRequest.onreadystatechange = (): void => {
      //
      // Part 6:  In our Sample, we evaluate a boolean response and treat true as was successfully processed and should proceed to next step,
      // and handle all other responses by cancelling out.
      // You may have different paradigms in your own API and are free to customize based on these.
      //

      if (this.latestNetworkRequest.readyState === XMLHttpRequest.DONE) {
        try {
          const responseJSON = JSON.parse(this.latestNetworkRequest.responseText);
          const scanResultBlob = responseJSON.scanResultBlob;

          // In v9.2.0+, we key off a new property called wasProcessed to determine if we successfully processed the Session result on the Server.
          // Device SDK UI flow is now driven by the proceedToNextStep function, which should receive the scanResultBlob from the Server SDK response.
          if (responseJSON.wasProcessed === true && responseJSON.error === false) {
            // Demonstrates dynamically setting the Success Screen Message.
            FaceTecSDK.FaceTecCustomization.setOverrideResultScreenSuccessMessage(
              "Face Scanned\n3D Liveness Proven",
            );

            this.token = responseJSON.token;

            // In v9.2.0+, simply pass in scanResultBlob to the proceedToNextStep function to advance the User flow.
            // scanResultBlob is a proprietary, encrypted blob that controls the logic for what happens next for the User.
            faceScanResultCallback.proceedToNextStep(scanResultBlob);
          } else {
            // CASE:  UNEXPECTED response from API.  Our Sample Code keys off a wasProcessed boolean on the root of the JSON object --> You define your own API contracts with yourself and may choose to do something different here based on the error.
            if (responseJSON.error === true && responseJSON.errorMessage != null) {
              this.cancelDueToNetworkError(responseJSON.errorMessage, faceScanResultCallback);
            } else {
              this.cancelDueToNetworkError(
                "Unexpected API response, cancelling out.",
                faceScanResultCallback,
              );
            }
          }
        } catch (_e) {
          // CASE:  Parsing the response into JSON failed --> You define your own API contracts with yourself and may choose to do something different here based on the error.  Solid server-side code should ensure you don't get to this case.
          this.cancelDueToNetworkError(
            "Exception while handling API response, cancelling out.",
            faceScanResultCallback,
          );
        }
      }
    };

    this.latestNetworkRequest.onerror = (): void => {
      // CASE:  Network Request itself is erroring --> You define your own API contracts with yourself and may choose to do something different here based on the error.
      this.cancelDueToNetworkError("XHR error, cancelling.", faceScanResultCallback);
    };

    //
    // Part 7:  Demonstrates updating the Progress Bar based on the progress event.
    //
    this.latestNetworkRequest.upload.onprogress = (event: ProgressEvent): void => {
      const progress = event.loaded / event.total;
      faceScanResultCallback.uploadProgress(progress);
    };

    //
    // Part 8:  Actually send the request.
    //
    const jsonStringToUpload = JSON.stringify(parameters);
    this.latestNetworkRequest.send(jsonStringToUpload);

    //
    // Part 9:  For better UX, update the User if the upload is taking a while.  You are free to customize and enhance this behavior to your liking.
    //
    window.setTimeout(() => {
      if (this.latestNetworkRequest.readyState === XMLHttpRequest.DONE) {
        return;
      }

      faceScanResultCallback.uploadMessageOverride("Still Uploading...");
    }, 6000);
  };

  //
  // Part 10:  This function gets called after the FaceTec SDK is completely done.  There are no parameters because you have already been passed all data in the processSessionWhileFaceTecSDKWaits function and have already handled all of your own results.
  //
  public onFaceTecSDKCompletelyDone = (): void => {
    //
    // DEVELOPER NOTE:  onFaceTecSDKCompletelyDone() is called after you signal the FaceTec SDK with success() or cancel().
    // Calling a custom function on the Sample App Controller is done for demonstration purposes to show you that here is where you get control back from the FaceTec SDK.
    //
    this.success = this.latestSessionResult?.isCompletelyDone ?? false;
    // Handle both success and cancellation scenarios
    if (this.success) {
      this.callback(true, this.token);
    } else {
      // Handle cancellation and failure scenarios
      const errorMessage = this.getCancellationReason();
      this.callback(false, undefined, errorMessage);
    }
  };

  // Helper function to get the cancellation reason
  private getCancellationReason = (): string => {
    if (this.cancelledDueToNetworkError) {
      if (this.lastNetworkErrorMessage) {
        return this.lastNetworkErrorMessage;
      }

      return "Network error occurred";
    }

    if (this.latestSessionResult) {
      switch (this.latestSessionResult.status) {
        case FaceTecSDK.FaceTecSessionStatus.UserCancelled:
          return "User cancelled the session";
        case FaceTecSDK.FaceTecSessionStatus.UserCancelledFromNewUserGuidance:
          return "User cancelled from guidance";
        case FaceTecSDK.FaceTecSessionStatus.UserCancelledFromRetryGuidance:
          return "User cancelled from retry guidance";
        case FaceTecSDK.FaceTecSessionStatus.Timeout:
          return "Session timed out";
        case FaceTecSDK.FaceTecSessionStatus.CameraNotEnabled:
          return "Camera not enabled";
        case FaceTecSDK.FaceTecSessionStatus.CameraNotRunning:
          return "Camera not running";
        case FaceTecSDK.FaceTecSessionStatus.ContextSwitch:
          return "Context switch occurred";
        case FaceTecSDK.FaceTecSessionStatus.ProgrammaticallyCancelled:
          return "Programmatically cancelled";
        default:
          return "Session cancelled";
      }
    }

    return "Session cancelled for unknown reason";
  };

  // Helper function to ensure the session is only cancelled once
  public cancelDueToNetworkError = (
    networkErrorMessage: string,
    faceScanResultCallback: FaceTecFaceScanResultCallback,
  ): void => {
    if (this.cancelledDueToNetworkError === false) {
      console.error(networkErrorMessage);
      this.lastNetworkErrorMessage = networkErrorMessage;
      this.cancelledDueToNetworkError = true;
      faceScanResultCallback.cancel();
    }

    this.callback(false, undefined, networkErrorMessage);
  };
}
