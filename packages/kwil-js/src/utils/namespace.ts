import { ActionBody, CallBody } from "../core/action";

export const validateNamespace = (namespace: string): boolean => {
  // Validate namespace
  if (!namespace || typeof namespace !== "string") {
    return false;
  }

  // Check for SQL injection attempts in namespace
  if (/[';{}\\]/.test(namespace)) {
    return false;
  }

  // validate alphanumeric and underscore
  if (!/^[a-zA-Z0-9_]+$/.test(namespace)) {
    return false;
  }

  return true;
};

export const resolveNamespace = (actionBody: ActionBody | CallBody): string => {
  if (actionBody.namespace) {
    return actionBody.namespace;
  }

  if (actionBody.dbid) {
    console.warn('Warning: The "dbid" field is deprecated. Please use "namespace" instead.');
    return actionBody.dbid;
  }

  throw new Error('Either "namespace" or "dbid" must be provided');
};
