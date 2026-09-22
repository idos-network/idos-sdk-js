import Axios from "axios";

const getMock = jest.fn();
const postMock = jest.fn();
const requestMock = jest.fn();

const requestInterceptors: any[] = [];
const responseInterceptors: any[] = [];

jest.mock("axios", () => ({
  create: jest.fn(() => ({
    get: getMock,
    post: postMock,
    interceptors: {
      request: {
        use: jest.fn((handler: any) => {
          requestInterceptors.push(handler);
          return 1; // Mocking the ID returned by Axios, which usually would be used for ejecting the interceptor later.
        }),
      },
      response: {
        use: jest.fn((handler: any) => {
          responseInterceptors.push(handler);
          return 1;
        }),
      },
    },
  })),
}));

const mockedAxios = Axios as jest.Mocked<typeof Axios>;

export { mockedAxios, getMock, postMock, requestInterceptors, responseInterceptors, requestMock };
