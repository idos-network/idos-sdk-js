import jwt from "jsonwebtoken";
import { SERVER_ENV } from "./envFlags.server";

export interface FileUrlData {
  credentialId: string;
  fileType: string;
}

export const generateFileUrl = (url: URL, credentialId: string, fileType: string) => {
  const jwtData: FileUrlData = {
    credentialId,
    fileType,
  };

  const token = jwt.sign(jwtData, SERVER_ENV.FILES_PRIVATE_KEY, {
    algorithm: "ES512",
    expiresIn: "30m",
  });

  const fileUrl = new URL(url.toString());
  fileUrl.protocol = "https";
  fileUrl.pathname = "/file";
  fileUrl.searchParams.forEach((_value, key) => {
    fileUrl.searchParams.delete(key);
  });
  fileUrl.searchParams.delete("signedAgreementId");
  fileUrl.searchParams.set("token", token);

  return fileUrl.toString();
};

export const verifyFileUrl = async (token: string) => {
  const decoded = jwt.verify(token, SERVER_ENV.FILES_PUBLIC_KEY, {
    algorithms: ["ES512"],
  }) as FileUrlData;

  return decoded;
};
