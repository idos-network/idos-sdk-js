import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { App } from "./app";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Add child routes here as needed
      {
        index: true,
        element: (
          <div className="flex items-center justify-center h-full text-white">FaceSign Enclave</div>
        ),
      },
    ],
  },
]);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
