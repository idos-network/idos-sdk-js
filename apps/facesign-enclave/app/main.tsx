import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import { App } from "./app";

const router = createMemoryRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Add child routes here as needed
      {
        index: true,
        element: (
          <div className="flex h-full items-center justify-center text-white">FaceSign Enclave</div>
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
