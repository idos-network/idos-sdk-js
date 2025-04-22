import { base64Encode } from "@idos-network/core";
import invariant from "tiny-invariant";

export const generateUserData = () => {
  invariant(process.env.E2E_USER_IDV_INFO, "E2E_USER_IDV_INFO are not passed");
  return JSON.parse(process.env.E2E_USER_IDV_INFO);
};
