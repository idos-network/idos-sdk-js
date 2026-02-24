import type {
  FaceTecInitializationError,
  FaceTecSDKInstance,
  FaceTecSessionStatus,
} from "@/assets/facetec/FaceTecPublicApi.d";
import type { FaceTecSDK } from "@/assets/facetec/FaceTecSDK";
import { env } from "@/env";
import { SessionRequestProcessor } from "./session-request-processor";

const TRANSPARENT_COLOR = "transparent";
const BRANDING_COLOR = "#00fbb9";

const DARK_BACKGROUND = "#262626";
const DARK_TEXT = "#f5f5f5";
const DARK_BUTTON_TEXT = "#1a1a1a";

const LIGHT_BACKGROUND = "#f5f5f5";
const LIGHT_TEXT = "#1a1a1a";
const LIGHT_BUTTON_TEXT = "#1a1a1a";

interface ThemeColors {
  background: string;
  text: string;
  buttonText: string;
  brandingImage: string;
}

export class FaceTecContainer {
  #FaceTecSDK: typeof FaceTecSDK | null = null;
  #faceTecSDKInstance!: FaceTecSDKInstance;
  #callback:
    | ((
        errorMessage?: string,
        attestationToken?: string,
        newUserConfirmationToken?: string,
      ) => void)
    | null = null;

  init = async (
    callback: (
      errorMessage?: string,
      attestationToken?: string,
      newUserConfirmationToken?: string,
    ) => void,
  ): Promise<void> => {
    this.#FaceTecSDK = await this.#ensureImportedFaceTecSDK();
    this.#FaceTecSDK.setResourceDirectory("/facetec/FaceTecSDK.js/resources");
    this.#FaceTecSDK.setImagesDirectory("/public/facetec/FaceTec_images");

    this.#callback = callback;

    if (this.#faceTecSDKInstance) {
      this.#setupCustomization();
      return this.startLivenessCheck();
    }

    this.#FaceTecSDK.initializeWithSessionRequest(
      env.VITE_FACETEC_DEVICE_KEY_IDENTIFIER,
      new SessionRequestProcessor(),
      {
        onSuccess: (newFaceTecSdkInstance: FaceTecSDKInstance) => {
          this.#faceTecSDKInstance = newFaceTecSdkInstance;
          this.#setupCustomization();
          this.startLivenessCheck();
        },
        onError: (errorMessage: FaceTecInitializationError) => {
          const description = this.descriptionForInitializationError(errorMessage);
          console.error("[FaceTec] Initialization error:", errorMessage, description);
          this.#callback?.(description);
        },
      },
    );
  };

  #ensureImportedFaceTecSDK(): Promise<typeof FaceTecSDK> {
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

  #buildCustomization(colors: ThemeColors) {
    const sdk = this.#FaceTecSDK;
    if (!sdk) throw new Error("FaceTecSDK is not loaded");

    const iFrameFeatureFlag = [{ ac_ziif: env.VITE_FACETEC_IFRAME_FEATURE_FLAG }];
    const c = new sdk.FaceTecCustomization(iFrameFeatureFlag);

    c.frameCustomization.borderCornerRadius = "20px";
    c.frameCustomization.backgroundColor = colors.background;
    c.frameCustomization.borderColor = colors.background;

    c.guidanceCustomization.backgroundColors = colors.background;
    c.guidanceCustomization.foregroundColor = colors.text;
    c.guidanceCustomization.buttonBackgroundNormalColor = BRANDING_COLOR;
    c.guidanceCustomization.buttonBackgroundDisabledColor = BRANDING_COLOR;
    c.guidanceCustomization.buttonBackgroundHighlightColor = BRANDING_COLOR;
    c.guidanceCustomization.buttonTextNormalColor = colors.buttonText;
    c.guidanceCustomization.buttonTextDisabledColor = colors.buttonText;
    c.guidanceCustomization.buttonTextHighlightColor = colors.buttonText;
    c.guidanceCustomization.retryScreenImageBorderColor = BRANDING_COLOR;
    c.guidanceCustomization.retryScreenOvalStrokeColor = BRANDING_COLOR;

    c.ovalCustomization.strokeColor = BRANDING_COLOR;
    c.ovalCustomization.progressColor1 = BRANDING_COLOR;
    c.ovalCustomization.progressColor2 = BRANDING_COLOR;

    c.feedbackCustomization.backgroundColor = colors.background;
    c.feedbackCustomization.textColor = colors.text;

    c.resultScreenCustomization.backgroundColors = colors.background;
    c.resultScreenCustomization.foregroundColor = TRANSPARENT_COLOR;
    c.resultScreenCustomization.activityIndicatorColor = BRANDING_COLOR;
    c.resultScreenCustomization.resultAnimationBackgroundColor = colors.background;
    c.resultScreenCustomization.resultAnimationForegroundColor = BRANDING_COLOR;
    c.resultScreenCustomization.uploadProgressFillColor = BRANDING_COLOR;

    c.initialLoadingAnimationCustomization.backgroundColor = colors.background;
    c.initialLoadingAnimationCustomization.foregroundColor = BRANDING_COLOR;
    c.initialLoadingAnimationCustomization.messageTextColor = colors.text;

    c.overlayCustomization.backgroundColor = TRANSPARENT_COLOR;
    c.overlayCustomization.brandingImage = colors.brandingImage;

    c.enterFullScreenCustomization.backgroundColors = colors.background;
    c.enterFullScreenCustomization.foregroundColor = colors.text;
    c.enterFullScreenCustomization.borderColor = colors.background;
    c.enterFullScreenCustomization.buttonBackgroundNormalColor = BRANDING_COLOR;
    c.enterFullScreenCustomization.buttonBackgroundHighlightColor = BRANDING_COLOR;
    c.enterFullScreenCustomization.buttonBackgroundDisabledColor = BRANDING_COLOR;
    c.enterFullScreenCustomization.buttonTextNormalColor = colors.buttonText;
    c.enterFullScreenCustomization.buttonTextHighlightColor = colors.buttonText;
    c.enterFullScreenCustomization.buttonTextDisabledColor = colors.buttonText;

    c.vocalGuidanceCustomization.mode = 2;

    return c;
  }

  #setupCustomization = (): void => {
    if (!this.#FaceTecSDK) return;

    const darkLogo = "/facesign-logo.svg";
    const lightLogo = "/facesign-logo-light.svg";

    const dark: ThemeColors = {
      background: DARK_BACKGROUND,
      text: DARK_TEXT,
      buttonText: DARK_BUTTON_TEXT,
      brandingImage: darkLogo,
    };
    const light: ThemeColors = {
      background: LIGHT_BACKGROUND,
      text: LIGHT_TEXT,
      buttonText: LIGHT_BUTTON_TEXT,
      brandingImage: lightLogo,
    };

    const darkCustomization = this.#buildCustomization(dark);
    const lightCustomization = this.#buildCustomization(light);

    this.#FaceTecSDK.setCustomization(darkCustomization);
    this.#FaceTecSDK.setLowLightCustomization(lightCustomization);
    this.#FaceTecSDK.setDynamicDimmingCustomization(lightCustomization);
  };

  startLivenessCheck(): void {
    if (!this.#faceTecSDKInstance) {
      console.error("FaceTecSDK is not available");
      return;
    }

    this.#faceTecSDKInstance.start3DLiveness(
      new SessionRequestProcessor(
        (result, lastReceivedAttestationToken, lastReceivedNewUserConfirmationToken) => {
          if (result.status !== this.#FaceTecSDK?.FaceTecSessionStatus.SessionCompleted) {
            const description = this.descriptionForSessionStatus(result.status);
            console.error("[FaceTec] Session failed:", result.status, description);
            this.#callback?.(description);
            return;
          }

          if (lastReceivedAttestationToken) {
            this.#callback?.(undefined, lastReceivedAttestationToken);
          } else if (lastReceivedNewUserConfirmationToken) {
            this.#callback?.(undefined, undefined, lastReceivedNewUserConfirmationToken);
          } else {
            console.error("[FaceTec] Session completed but no token was received.");
            this.#callback?.("Session completed but no token was received from the server.");
          }
        },
      ),
    );
  }

  descriptionForInitializationError(enumValue: FaceTecInitializationError): string {
    if (!this.#FaceTecSDK) {
      return "FaceTecSDK is not available";
    }

    switch (enumValue) {
      case this.#FaceTecSDK.FaceTecInitializationError.RejectedByServer:
        return "The FaceTec SDK Server could not validate this application.";
      case this.#FaceTecSDK.FaceTecInitializationError.RequestAborted:
        return "The provided FaceTecSessionRequestProcessor called abortOnCatastrophicError() and the application could not be validated.";
      case this.#FaceTecSDK.FaceTecInitializationError.DeviceNotSupported:
        return "This device/platform/browser/version combination is not supported by the FaceTec Browser SDK.";
      case this.#FaceTecSDK.FaceTecInitializationError.ResourcesCouldNotBeLoadedOnLastInit:
        return "FaceTec SDK could not load resources.";
      case this.#FaceTecSDK.FaceTecInitializationError.GetUserMediaRemoteHTTPNotSupported:
        return "Browser Camera APIs are only supported on localhost or https.";
      case this.#FaceTecSDK.FaceTecInitializationError.UnknownInternalError:
        return "An unknown and unexpected error occurred.";
      default:
        return `Unexpected FaceTecInitializationError Value: ${enumValue}`;
    }
  }

  descriptionForSessionStatus(enumValue: FaceTecSessionStatus): string {
    if (!this.#FaceTecSDK) {
      return "FaceTecSDK is not available";
    }

    switch (enumValue) {
      case this.#FaceTecSDK.FaceTecSessionStatus.SessionCompleted:
        return "The Session was performed successfully.";
      case this.#FaceTecSDK.FaceTecSessionStatus.RequestAborted:
        return "The application called abortOnCatastrophicError().";
      case this.#FaceTecSDK.FaceTecSessionStatus.UserCancelledFaceScan:
        return "The user cancelled before performing enough Scans to Succeed.";
      case this.#FaceTecSDK.FaceTecSessionStatus.UserCancelledIDScan:
        return "The user cancelled before performing enough Scans to Complete.";
      case this.#FaceTecSDK.FaceTecSessionStatus.LockedOut:
        return "FaceTec Browser SDK is in a lockout state.";
      case this.#FaceTecSDK.FaceTecSessionStatus.CameraError:
        return "Session cancelled because selected camera is not active.";
      case this.#FaceTecSDK.FaceTecSessionStatus.CameraPermissionsDenied:
        return "The user did not enable the camera after prompting for camera permissions or camera permissions were previously denied.";
      case this.#FaceTecSDK.FaceTecSessionStatus.IFrameNotAllowedWithoutPermission:
        return "The Session was cancelled because you do not have permission to run the FaceTec Browser SDK in an iFrame. Please contact FaceTec to request the needed code";
      case this.#FaceTecSDK.FaceTecSessionStatus.UnknownInternalError:
        return "The Session was cancelled because of an Unknown Error.";
      default:
        return `Unexpected FaceTecSessionStatus Value: ${enumValue}`;
    }
  }
}

const faceTec = new FaceTecContainer();
export { faceTec };
