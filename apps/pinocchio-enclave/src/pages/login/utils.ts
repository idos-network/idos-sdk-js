import type {
  FaceTecInitializationError,
  FaceTecSDKInstance,
  FaceTecSessionStatus,
} from "../../assets/facetec/FaceTecPublicApi.d";
import type { FaceTecSDK } from "../../assets/facetec/FaceTecSDK";
import { env } from "../../env.js";
import { SessionRequestProcessor } from "./processor.js";

const TRANSPARENT_COLOR = "transparent";
const BRANDING_COLOR = "#00fbb9";
const BACKGROUND_COLOR = "#262626";
const TEXT_COLOR = "#f5f5f5";
const BUTTON_TEXT_COLOR = "#1a1a1a";

export class FaceTecContainer {
  private FaceTecSDK: typeof FaceTecSDK | null = null;
  private faceTecSDKInstance!: FaceTecSDKInstance;
  private callback: ((errorMessage?: string, token?: string) => void) | null = null;

  public init = async (
    callback: (errorMessage?: string, token?: string) => void,
  ): Promise<void> => {
    // Ensure FaceTecSDK is imported & initialized
    this.FaceTecSDK = await this.ensureImportedFaceTecSDK();
    this.FaceTecSDK.setResourceDirectory("/facetec/FaceTecSDK.js/resources");
    this.FaceTecSDK.setImagesDirectory("/public/facetec/FaceTec_images");

    this.callback = callback;

    if (this.faceTecSDKInstance) {
      this.setupCustomization();
      return this.startLivenessCheck();
    }

    this.FaceTecSDK.initializeWithSessionRequest(
      env.VITE_FACETEC_DEVICE_KEY_IDENTIFIER,
      new SessionRequestProcessor(),
      {
        onSuccess: (newFaceTecSdkInstance: FaceTecSDKInstance) => {
          this.faceTecSDKInstance = newFaceTecSdkInstance;
          this.setupCustomization();
          this.startLivenessCheck();
        },
        onError: (errorMessage: FaceTecInitializationError) => {
          this.callback?.(this.descriptionForInitializationError(errorMessage));
        },
      },
    );
  };

  private ensureImportedFaceTecSDK(): Promise<typeof FaceTecSDK> {
    return new Promise((resolve) => {
      let script: HTMLScriptElement | undefined = document.getElementById("facetec-sdk-script") as
        | HTMLScriptElement
        | undefined;

      if (script) {
        // @ts-expect-error This is a hack for global variables from imported JS file.
        resolve(window.FaceTecSDK as typeof FaceTecSDK);
      } else {
        script = document.createElement("script");
        script.id = "facetec-sdk-script";
        script.type = "text/javascript";
        script.async = true;
        script.src = "/facetec/FaceTecSDK.js/FaceTecSDK.js";
        script.onload = () => {
          // @ts-expect-error This is a hack for global variables from imported JS file.
          resolve(window.FaceTecSDK as typeof FaceTecSDK);
        };
        document.body.appendChild(script);
      }
    });
  }

  private setupCustomization = (): void => {
    if (!this.FaceTecSDK) return;

    const currentCustomization = new this.FaceTecSDK.FaceTecCustomization();

    // Set Frame Customization
    currentCustomization.frameCustomization.borderCornerRadius = "20px";
    currentCustomization.frameCustomization.backgroundColor = BACKGROUND_COLOR;
    currentCustomization.frameCustomization.borderColor = BACKGROUND_COLOR;

    // Set Guidance Customization
    currentCustomization.guidanceCustomization.backgroundColors = BACKGROUND_COLOR;
    currentCustomization.guidanceCustomization.foregroundColor = TEXT_COLOR;
    currentCustomization.guidanceCustomization.buttonBackgroundNormalColor = BRANDING_COLOR;
    currentCustomization.guidanceCustomization.buttonBackgroundDisabledColor = BRANDING_COLOR;
    currentCustomization.guidanceCustomization.buttonBackgroundHighlightColor = BRANDING_COLOR;
    currentCustomization.guidanceCustomization.buttonTextNormalColor = BUTTON_TEXT_COLOR;
    currentCustomization.guidanceCustomization.buttonTextDisabledColor = BUTTON_TEXT_COLOR;
    currentCustomization.guidanceCustomization.buttonTextHighlightColor = BUTTON_TEXT_COLOR;
    currentCustomization.guidanceCustomization.retryScreenImageBorderColor = BRANDING_COLOR;
    currentCustomization.guidanceCustomization.retryScreenOvalStrokeColor = BRANDING_COLOR;

    // Set Oval Customization
    currentCustomization.ovalCustomization.strokeColor = BRANDING_COLOR;
    currentCustomization.ovalCustomization.progressColor1 = BRANDING_COLOR;
    currentCustomization.ovalCustomization.progressColor2 = BRANDING_COLOR;

    // Set Feedback Customization
    currentCustomization.feedbackCustomization.backgroundColor = BACKGROUND_COLOR;
    currentCustomization.feedbackCustomization.textColor = TEXT_COLOR;

    // Set Result Screen Customization
    currentCustomization.resultScreenCustomization.backgroundColors = BACKGROUND_COLOR;
    currentCustomization.resultScreenCustomization.foregroundColor = TRANSPARENT_COLOR;
    currentCustomization.resultScreenCustomization.activityIndicatorColor = BRANDING_COLOR;
    currentCustomization.resultScreenCustomization.resultAnimationBackgroundColor =
      BACKGROUND_COLOR;
    currentCustomization.resultScreenCustomization.resultAnimationForegroundColor = BRANDING_COLOR;
    currentCustomization.resultScreenCustomization.uploadProgressFillColor = BRANDING_COLOR;

    // Set Initial Loading Customization
    currentCustomization.initialLoadingAnimationCustomization.backgroundColor = BACKGROUND_COLOR;
    currentCustomization.initialLoadingAnimationCustomization.foregroundColor = BRANDING_COLOR;
    currentCustomization.initialLoadingAnimationCustomization.messageTextColor = TEXT_COLOR;

    // Set overlay customization
    currentCustomization.overlayCustomization.backgroundColor = TRANSPARENT_COLOR;
    currentCustomization.overlayCustomization.brandingImage = "/public/idos-logo.svg";

    currentCustomization.enterFullScreenCustomization.buttonBackgroundNormalColor = BRANDING_COLOR;
    currentCustomization.enterFullScreenCustomization.buttonBackgroundHighlightColor =
      BRANDING_COLOR;
    currentCustomization.enterFullScreenCustomization.foregroundColor = BRANDING_COLOR;

    currentCustomization.vocalGuidanceCustomization.mode = 2;

    this.FaceTecSDK.setCustomization(currentCustomization);
  };

  public startLivenessCheck(): void {
    if (!this.faceTecSDKInstance) {
      console.error("FaceTecSDK is not available");
      return;
    }

    this.faceTecSDKInstance.start3DLiveness(
      new SessionRequestProcessor((result, lastReceivedToken) => {
        // biome-ignore lint/style/noNonNullAssertion: This was checked above
        if (
          result.status === this.FaceTecSDK!.FaceTecSessionStatus.SessionCompleted &&
          lastReceivedToken
        ) {
          this.callback?.(undefined, lastReceivedToken);
        } else {
          this.callback?.(this.descriptionForSessionStatus(result.status));
        }
      }),
    );
  }

  public descriptionForInitializationError(enumValue: FaceTecInitializationError): string {
    if (!this.FaceTecSDK) {
      return "FaceTecSDK is not available";
    }

    switch (enumValue) {
      case this.FaceTecSDK.FaceTecInitializationError.RejectedByServer:
        return "The FaceTec SDK Server could not validate this application.";
      case this.FaceTecSDK.FaceTecInitializationError.RequestAborted:
        return "The provided FaceTecSessionRequestProcessor called abortOnCatastrophicError() and the application could not be validated.";
      case this.FaceTecSDK.FaceTecInitializationError.DeviceNotSupported:
        return "This device/platform/browser/version combination is not supported by the FaceTec Browser SDK.";
      case this.FaceTecSDK.FaceTecInitializationError.ResourcesCouldNotBeLoadedOnLastInit:
        return "FaceTec SDK could not load resources.";
      case this.FaceTecSDK.FaceTecInitializationError.GetUserMediaRemoteHTTPNotSupported:
        return "Browser Camera APIs are only supported on localhost or https.";
      case this.FaceTecSDK.FaceTecInitializationError.UnknownInternalError:
        return "An unknown and unexpected error occurred.";
      default:
        return `Unexpected FaceTecInitializationError Value: ${enumValue}`;
    }
  }

  public descriptionForSessionStatus(enumValue: FaceTecSessionStatus): string {
    if (!this.FaceTecSDK) {
      return "FaceTecSDK is not available";
    }

    switch (enumValue) {
      case this.FaceTecSDK.FaceTecSessionStatus.SessionCompleted:
        return "The Session was performed successfully.";
      case this.FaceTecSDK.FaceTecSessionStatus.RequestAborted:
        return "The application called abortOnCatastrophicError().";
      case this.FaceTecSDK.FaceTecSessionStatus.UserCancelledFaceScan:
        return "The user cancelled before performing enough Scans to Succeed.";
      case this.FaceTecSDK.FaceTecSessionStatus.UserCancelledIDScan:
        return "The user cancelled before performing enough Scans to Complete.";
      case this.FaceTecSDK.FaceTecSessionStatus.LockedOut:
        return "FaceTec Browser SDK is in a lockout state.";
      case this.FaceTecSDK.FaceTecSessionStatus.CameraError:
        return "Session cancelled because selected camera is not active.";
      case this.FaceTecSDK.FaceTecSessionStatus.CameraPermissionsDenied:
        return "The user did not enable the camera after prompting for camera permissions or camera permissions were previously denied.";
      case this.FaceTecSDK.FaceTecSessionStatus.IFrameNotAllowedWithoutPermission:
        return "The Session was cancelled because you do not have permission to run the FaceTec Browser SDK in an iFrame. Please contact FaceTec to request the needed code";
      case this.FaceTecSDK.FaceTecSessionStatus.UnknownInternalError:
        return "The Session was cancelled because of an Unknown Error.";
      default:
        return `Unexpected FaceTecSessionStatus Value: ${enumValue}`;
    }
  }
}

const faceTec = new FaceTecContainer();
export { faceTec };
