import "./styles.css";

import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import { App } from "./app";
import ProtectedRoute from "./lib/protected-route";
import ErrorPage from "./pages/error";
import Home from "./pages/home";
import Login from "./pages/login";
import Session from "./pages/session";
import Sign from "./pages/sign";
import Wallet from "./pages/wallet";

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: "login",
        Component: Login,
      },
      {
        path: "error",
        Component: ErrorPage,
      },
      {
        // Protected routes - require stored encrypted mnemonic
        Component: ProtectedRoute,
        children: [
          {
            path: "session",
            Component: Session,
          },
          {
            path: "wallet",
            Component: Wallet,
          },
          {
            path: "sign",
            Component: Sign,
          },
        ],
      },
    ],
  },
]);

const domNode = document.getElementById("root");

if (!domNode) throw new Error("No root element found");

const root = createRoot(domNode);
root.render(<RouterProvider router={router} />);
