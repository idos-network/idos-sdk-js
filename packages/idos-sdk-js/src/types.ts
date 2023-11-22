export const assertNever = (_: never, msg: string): never => {
  throw new Error(msg);
};
