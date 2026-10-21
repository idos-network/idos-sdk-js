import { describe, expect, it, vi } from "vitest";

import { Api } from "../api_client/api";
import { ApiConfig } from "../api_client/config";
import { mockedAxios, getMock, postMock, requestInterceptors } from "./axios.mock";

vi.mock("axios", async () => (await import("./axios.mock")).axiosModuleMock);

class TestApi extends Api {
  public constructor(opts: ApiConfig) {
    super(opts);
  }
}

describe("Api", () => {
  const defaultConfig = {
    kwilProvider: "shouldn't matter",
    timeout: 10000,
    logging: false,
    logger: console.log,
    cache: 10 * 60,
  };

  describe("mergeDefaults", () => {
    it("should merge default options", () => {
      const api = new TestApi(defaultConfig);
      const result = api["mergeDefaults"](defaultConfig);
      expect(result).toEqual(defaultConfig);
    });
  });

  describe("get", () => {
    it("should handle successful get request", async () => {
      getMock.mockResolvedValue({ data: "success" });

      const api = new TestApi(defaultConfig);
      const response = await api["get"]("testEndpoint");
      expect(response.data).toBe("success");
    });

    it("should handle error get request", async () => {
      getMock.mockRejectedValue({
        response: {
          status: 400,
          data: "error",
        },
      });

      const api = new TestApi(defaultConfig);
      const response = await api["get"]("testEndpoint");
      expect(response.status).toBe(400);
    });
  });

  describe("post", () => {
    it("should handle successful post request", async () => {
      postMock.mockResolvedValue({ data: "success" });

      const api = new TestApi(defaultConfig);
      const response = await api["post"]("testEndpoint", {});
      expect(response.data).toBe("success");
    });

    it("should handle error post request", async () => {
      postMock.mockRejectedValue({
        response: {
          status: 400,
          data: "error",
        },
      });

      const api = new TestApi(defaultConfig);
      const response = await api["post"]("testEndpoint", {});
      expect(response.status).toBe(400);
    });
  });

  describe("request", () => {
    it("should create axios instance with correct config", () => {
      const api = new TestApi(defaultConfig);
      api["request"]();
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "shouldn't matter",
          timeout: 10000,
          maxContentLength: 536870912,
          withCredentials: true,
          headers: expect.any(Object),
        }),
      );
    });

    it("should add logging interceptors if logging is enabled", () => {
      const loggerMock = vi.fn();
      const api = new TestApi({
        ...defaultConfig,
        logging: true,
        logger: loggerMock,
      });
      api["request"]();

      // Check if a request interceptor was added.
      expect(requestInterceptors.length).toBeGreaterThan(0);

      // You could also simulate a request to see if the logger gets called
      const dummyRequest = { baseURL: "http://test.com", url: "/dummy" };
      requestInterceptors[0](dummyRequest);
      expect(loggerMock).toHaveBeenCalledWith("Requesting: http://test.com/dummy");
    });
  });
});
