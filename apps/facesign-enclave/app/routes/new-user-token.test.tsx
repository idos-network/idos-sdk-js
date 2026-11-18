// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type FaceTecCallback = (
  errorMessage?: string,
  attestationToken?: string,
  newUserConfirmationToken?: string,
) => void;

let faceTecCallback: FaceTecCallback | undefined;
vi.mock("@/lib/facetec", () => ({
  faceTec: {
    init: (callback: FaceTecCallback) => {
      faceTecCallback = callback;
    },
  },
}));

const confirmNewUser = vi.fn(async (_token: string) => ({
  userAttestmentToken: "attestation",
  faceSignUserId: "user",
}));
vi.mock("@/lib/api", () => ({
  confirmNewUser: (token: string) => confirmNewUser(token),
  getEntropy: async () => ({ entropy: "entropy" }),
}));

vi.mock("@/providers/key.provider", () => ({
  useKeyStorageContext: () => ({ isKeyAvailable: false, setMnemonic: async () => {} }),
}));

const { default: Scan } = await import("./scan");
const { default: AppError } = await import("./error");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

async function render(initialEntry: string) {
  const router = createMemoryRouter(
    [
      { path: "/scan", element: <Scan /> },
      { path: "/error", element: <AppError /> },
    ],
    { initialEntries: [initialEntry] },
  );
  await act(async () => root.render(<RouterProvider router={router} />));
}

function createAccountButton() {
  return [...container.querySelectorAll("button")].find((button) =>
    button.textContent?.includes("Create FaceSign Account"),
  );
}

beforeEach(() => {
  faceTecCallback = undefined;
  confirmNewUser.mockClear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("new-user confirmation token", () => {
  it("confirms the token the face scan returned", async () => {
    await render("/scan");
    await act(async () => faceTecCallback?.(undefined, undefined, "scan-token"));

    const button = createAccountButton();
    expect(button).toBeDefined();
    await act(async () => button?.click());

    expect(confirmNewUser).toHaveBeenCalledWith("scan-token");
  });

  it("ignores a token in the URL", async () => {
    await render("/error?message=No+FaceSign+profile+found&token=attacker-token");

    expect(createAccountButton()).toBeUndefined();
    expect(container.textContent).toContain("An error occurred");
    expect(confirmNewUser).not.toHaveBeenCalled();
  });
});
