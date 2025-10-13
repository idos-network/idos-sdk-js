import type { FaceTecSDK } from "../../../public/facetec/FaceTecSDK.js/FaceTecSDK.js";
import { env } from "../../env.js";
import { getSessionToken } from "../../lib/api.js";
import { LivenessCheckProcessor } from "./processor.js";

const TRANSPARENT_COLOR = "transparent";
const BRANDING_COLOR = "#00fbb9";
const BACKGROUND_COLOR = "#262626";
const TEXT_COLOR = "#f5f5f5";
const BUTTON_TEXT_COLOR = "#1a1a1a";

export class FaceTecContainer {
  private FaceTecSDK: typeof FaceTecSDK | null = null;

  public init = async (
    publicKey: string,
    onDone: (errorMessage?: string) => void,
  ): Promise<void> => {
    // Ensure FaceTecSDK is imported & initialized
    this.FaceTecSDK = await this.ensureImportedFaceTecSDK();
    this.FaceTecSDK.setResourceDirectory("/facetec/FaceTecSDK.js/resources");
    this.FaceTecSDK.setImagesDirectory("/facetec/FaceTecSDK.js/FaceTec_images");

    if (this.FaceTecSDK.getStatus() === this.FaceTecSDK.FaceTecSDKStatus.NeverInitialized) {
      this.setupCustomization();
    }

    const afterInitialization = () => {
      if (!this.FaceTecSDK) {
        return onDone("FaceTecSDK is not available");
      }

      const faceTecStatus = this.FaceTecSDK.getStatus();
      if (faceTecStatus === this.FaceTecSDK.FaceTecSDKStatus.Initialized) {
        onDone();
      } else if (faceTecStatus === this.FaceTecSDK.FaceTecSDKStatus.NeverInitialized) {
        window.console.info("FaceTecSDK: Never Initialized ... initializing");
        // No reason to call onDone here, initialization is in progress
      } else if (faceTecStatus === this.FaceTecSDK.FaceTecSDKStatus.StillLoadingResources) {
        window.console.info("FaceTecSDK: Loading resources ...");
        // No reason to call onDone here, initialization is in progress
      } else if (faceTecStatus === this.FaceTecSDK.FaceTecSDKStatus.DeviceLockedOut) {
        onDone("Device is locked out due to too many failed attempts. Please try again later.");
      } else {
        onDone(
          `FaceTec initialization error: ${this.FaceTecSDK.getFriendlyDescriptionForFaceTecSDKStatus(faceTecStatus)}`,
        );
      }
    };

    this.FaceTecSDK.initializeInDevelopmentMode(
      env.VITE_FACETEC_DEVICE_KEY_IDENTIFIER,
      publicKey,
      afterInitialization,
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
    currentCustomization.overlayCustomization.brandingImage = "idos-face-sign-logo.svg";

    currentCustomization.enterFullScreenCustomization.buttonBackgroundNormalColor = BRANDING_COLOR;
    currentCustomization.enterFullScreenCustomization.buttonBackgroundHighlightColor =
      BRANDING_COLOR;
    currentCustomization.enterFullScreenCustomization.foregroundColor = BRANDING_COLOR;

    currentCustomization.vocalGuidanceCustomization.mode = 2;

    this.FaceTecSDK.setCustomization(currentCustomization);
  };

  public onLivenessCheckClick = (
    onDone: (status: boolean, token?: string, errorMessage?: string) => void,
  ): void => {
    if (!this.FaceTecSDK) {
      console.error("FaceTecSDK is not available");
      return;
    }

    this.getSessionToken((sessionToken: string) => {
      new LivenessCheckProcessor(sessionToken, onDone);
    });
  };

  private getSessionToken = (callback: (sessionToken: string) => void): void => {
    if (!this.FaceTecSDK) {
      console.error("FaceTecSDK is not available");
      return;
    }

    getSessionToken(this.FaceTecSDK.createFaceTecAPIUserAgentString("")).then(callback);
  };
}

const faceTec = new FaceTecContainer();
export { faceTec };
