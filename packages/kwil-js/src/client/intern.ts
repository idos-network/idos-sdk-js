import { EnvironmentType } from "../core/enums";
import { GenericResponse } from "../core/resreq";
import { Transaction } from "../core/tx";
import { objects } from "../utils/objects";
import { Kwil } from "./kwil";

const key = Symbol("estimate");

export function unwrap<T extends EnvironmentType>(
  kwil: Kwil<T>,
): (tx: Transaction) => Promise<GenericResponse<string>> {
  objects.requireNonNil(kwil);
  return objects.requireNonNil((kwil as any)[key]);
}

export function wrap<T extends EnvironmentType>(
  kwil: Kwil<T>,
  method: (tx: Transaction) => Promise<GenericResponse<string>>,
): void {
  objects.requireNonNil(kwil);
  (kwil as any)[key] = method;
}
