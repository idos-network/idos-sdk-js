import "./styles.css";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { App } from "./app";
import Home from "./pages/home";
import Login from "./pages/login";
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
        path: "wallet",
        Component: Wallet,
      },
    ],
  },
]);

const domNode = document.getElementById("root");

if (!domNode) throw new Error("No root element found");

const root = createRoot(domNode);
root.render(<RouterProvider router={router} />);
