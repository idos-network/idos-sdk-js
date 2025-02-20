import { ChakraProvider, EnvironmentProvider, defaultSystem } from "@chakra-ui/react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { FrameContextConsumer } from "react-frame-component";

function memoize<T extends object, R>(func: (arg: T) => R): (arg: T) => R {
  const cache = new WeakMap<T, R>();
  return (arg: T) => {
    if (cache.has(arg)) {
      // biome-ignore lint/style/noNonNullAssertion: it's guaranteed to be non-null
      return cache.get(arg)!;
    }

    const ret = func(arg);
    cache.set(arg, ret);
    return ret;
  };
}

const createCacheFn = memoize((container: HTMLElement) => createCache({ container, key: "frame" }));

export const IframeProvider = (props: React.PropsWithChildren) => {
  const { children } = props;
  return (
    <FrameContextConsumer>
      {(frame) => {
        const head = frame.document?.head;
        if (!head) {
          return null;
        }

        return (
          <CacheProvider value={createCacheFn(head)}>
            <EnvironmentProvider value={() => head.ownerDocument}>
              <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
            </EnvironmentProvider>
          </CacheProvider>
        );
      }}
    </FrameContextConsumer>
  );
};
