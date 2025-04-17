import { base64Encode } from "@idos-network/core";

export const generateBase64String = () => {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return base64Encode(randomBytes);
};

export const generateUserData = (userId: string) => {
  return {
    idOSUserId: userId,
    idvUserId: crypto.randomUUID(),
    signature: generateBase64String(),
  };
};
