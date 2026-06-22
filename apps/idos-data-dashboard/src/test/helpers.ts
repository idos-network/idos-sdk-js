export function getSetCookieHeader(response: Response): string {
  const setCookie = response.headers.get("set-cookie");

  if (!setCookie) {
    throw new Error("Expected Set-Cookie header on response");
  }

  return setCookie;
}

export function createJsonRequest(
  url: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {},
): Request {
  const { body, headers, ...rest } = init;

  return new Request(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
