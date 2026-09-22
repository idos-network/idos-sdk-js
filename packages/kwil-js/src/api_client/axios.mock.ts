import { type Mock, vi } from "vitest";

// Shared axios test double. Test files activate it with:
//   vi.mock("axios", async () => (await import("<path>/axios.mock")).axiosModuleMock);
export const getMock: Mock = vi.fn();
export const postMock: Mock = vi.fn();

export const requestInterceptors: ((config: unknown) => unknown)[] = [];
export const responseInterceptors: ((response: unknown) => unknown)[] = [];

export const mockedAxios = {
  create: vi.fn((_config?: Record<string, unknown>) => ({
    get: getMock,
    post: postMock,
    interceptors: {
      request: {
        use: vi.fn((handler: (config: unknown) => unknown) => {
          requestInterceptors.push(handler);
          return 1; // Axios returns an interceptor id, used for ejecting it later.
        }),
      },
      response: {
        use: vi.fn((handler: (response: unknown) => unknown) => {
          responseInterceptors.push(handler);
          return 1;
        }),
      },
    },
  })),
};

export const axiosModuleMock = { default: mockedAxios };
