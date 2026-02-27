import { FaceTecSDKInstance, FaceTecSessionRequestProcessor } from "./FaceTecPublicApi";
export declare class FaceTecSDKInstanceImpl implements FaceTecSDKInstance {
  start3DLiveness(sessionRequestProcessor: FaceTecSessionRequestProcessor): void;
  start3DLivenessThen3DFaceMatch(sessionRequestProcessor: FaceTecSessionRequestProcessor): void;
  startIDScanOnly(sessionRequestProcessor: FaceTecSessionRequestProcessor): void;
  startIDScanThen3D2DMatch(sessionRequestProcessor: FaceTecSessionRequestProcessor): void;
  start3DLivenessThen3D2DPhotoIDMatch(
    sessionRequestProcessor: FaceTecSessionRequestProcessor,
  ): void;
  startSecureOfficialIDPhotoCapture(sessionRequestProcessor: FaceTecSessionRequestProcessor): void;
  private static startSession;
}
//# sourceMappingURL=FaceTecSession.d.ts.map
