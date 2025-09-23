const postHeaders: Record<string, string> = {
  Accept: "application/json, text/plain, */*",
  "Content-Type": "application/json",
};

const getHeaders: Record<string, string> = {
  Accept: "application/json, text/plain, */*",
};

export type RequestType = "GET" | "PUT" | "POST" | "PATCH";

function buildOptions<T>(method: RequestType, headers: Record<string, string>, entityBytes: T) {
  const result: RequestInit = { method, headers, body: null };

  if (entityBytes != null) {
    result.body = JSON.stringify(entityBytes);
  }
  return result;
}

/**
 * Make a http get-request.
 *
 * @param url the url to request.
 * @return a promise containing the result of the get request.
 */
export function getRequest<R>(url: string): Promise<{ status: string; body: R | undefined }> {
  const options = buildOptions("GET", getHeaders, null);
  return handleFetch<R>(fetch(url, options));
}

/**
 * Make a http put-request.
 *
 * @param url the url to request.
 * @param object the object to put.
 * @param headers
 * @return a promise containing whether the put succeeded or not.
 */
export function putRequest<T>(url: string, object: T, headers?: Record<string, string>): Promise<string> {
  const options = buildOptions("PUT", { ...postHeaders, ...headers }, object);
  return fetch(url, options)
      .then(async (response) => {
        const responseClone = response.clone();
        const responseBody = await responseClone.text();
        console.log({responseCode: response.status, responseBody});
        return response.status.toString();
    })
    .catch((error) => {
      console.error(error);
      return error;
    });
}

/**
 * Make a http patch-request.
 *
 * @param url the url to request.
 * @param object the object to put.
 * @param headers
 * @return a promise containing whether the put succeeded or not.
 */
export function patchRequest<T>(url: string, object: T, headers?: Record<string, string>): Promise<string> {
  const options = buildOptions("PATCH", { ...postHeaders, ...headers }, object);
  return fetch(url, options)
    .then(async (response) => {
      const responseClone = response.clone();
      const responseBody = await responseClone.text();
      console.log({responseCode: response.status, responseBody});
      return response.status.toString();
    })
    .catch((error) => {
      console.error(error);
      return error;
    });
}

/**
 * Make a http post-request.
 *
 * @param url the url to request.
 * @param object the object to post.
 * @param headers
 * @return a promise containing the result of the post request.
 */
export function postRequest<T, R>(
  url: string,
  object: T,
  headers?: Record<string, string>,
): Promise<{ status: string; body: R | undefined }> {
  const options = buildOptions("POST", { ...postHeaders, ...headers }, object);
  return handleFetch<R>(fetch(url, options));
}

function handleFetch<T>(
  promise: Promise<Response>,
): Promise<{ status: string; body: T | undefined }> {
  return promise
    .then(async (response) => {
      const responseClone = response.clone();
      const responseBody = await responseClone.text();
      console.log({responseCode: response.status, responseBody});

      if (response.status === 200) {
        const data = (await response.json()) as T;
        return { status: response.status.toString(), body: data };
      }
      return { status: response.status.toString(), body: undefined };
    })
    .catch((error) => {
      console.error(error);
      return { status: "fetch-error", body: undefined };
    });
}
