import { goTrySync } from "go-try";
import type { idOSIsleControllerOptions } from "./types";

/**
 * Safely parses `JSON` strings.
 */
function safeParse(value: string): unknown {
  const [error, content] = goTrySync(() => JSON.parse(value));

  if (error) {
    console.error(error);
    return {};
  }

  return content;
}

/**
 * Class implementation of the idOS Isle controller
 * Manages the communication between the host application and the idOS Isle via an iframe.
 */
export class idOSIsleController {
  private readonly options: idOSIsleControllerOptions;

  constructor(options: idOSIsleControllerOptions) {
    this.options = options;
  }
}

export function createIsleController(options: idOSIsleControllerOptions): idOSIsleController {
  return new idOSIsleController(options);
}
