import { useLocalStorage } from "@uidotdev/usehooks";

export const useSecretKey = () => {
  const [secretKey, setSecretKey] = useLocalStorage("SECRET_KEY", "");
  return [secretKey, setSecretKey] as const;
};
