import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { KeyStorageContextProvider } from "@/providers/key.provider";
import { RequestsContextProvider } from "@/providers/requests.provider";
import "./styles.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>idOS FaceSign Enclave</title>
        <Meta />
        <Links />
      </head>
      <body className="relative">
        <div id="root" className="isolate">
          {children}
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return <div className="flex min-h-svh items-center justify-center bg-background" />;
}

export default function App() {
  return (
    <KeyStorageContextProvider>
      <RequestsContextProvider>
        <div className="min-h-svh">
          <Outlet />
        </div>
      </RequestsContextProvider>
    </KeyStorageContextProvider>
  );
}
