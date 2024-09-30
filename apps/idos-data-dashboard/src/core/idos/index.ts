import { useContext } from "react";

import { idOSContext } from "./idos-context";

export * from "./idos-provider";

export const useIdOS = () => {
  const idos = useContext(idOSContext);

  if (!idos) {
    throw new Error("idOS is not initialized");
  }
  //@ts-ignore
  (window as any).idos = idos;
  return idos;
};
