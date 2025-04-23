import invariant from "tiny-invariant";

export const generateUserData = () => {
  invariant(process.env.NEXT_PUBLIC_E2E_USER_IDV_INFO, "E2E_USER_IDV_INFO are not passed");
  return JSON.parse(process.env.NEXT_PUBLIC_E2E_USER_IDV_INFO);
};
