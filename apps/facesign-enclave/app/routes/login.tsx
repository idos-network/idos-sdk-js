import Bowser from "bowser";
import { useEffect, useState } from "react";
import { QRCode } from "react-qr-code";
import { useLoaderData, useNavigate, useRevalidator, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getEntropy } from "@/lib/api";
import {
  createSession,
  getAttestationToken,
  getSession,
  type HandoffSession,
} from "@/lib/handoff-store";
import { sessionStorage } from "@/lib/sessions.server";
import { useKeyStorageContext } from "@/providers/key.provider";

import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  const sessionData = await sessionStorage.getSession(request.headers.get("Cookie"));

  let session: HandoffSession | null | undefined;
  const sessionId = sessionData.get("sessionId");
  if (sessionId) {
    session = await getSession(sessionId);
  }

  // Not redeemed here: if this response is lost, the next poll gets the token again.
  // The client redeems it once it has exchanged the token (DELETE /api/handoff/:id).
  if (session) {
    const attestationToken = await getAttestationToken(session.id);
    if (attestationToken) {
      session = { ...session, status: "completed", attestationToken };
    }
  }

  if (!session) {
    session = await createSession();
  }

  sessionData.set("sessionId", session.id);

  return Response.json(session, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(sessionData),
    },
  });
}

// Tells the server the token was received so it can be redeemed. Retried because until then the
// token stays readable (to this session's cookie holder) until the session expires.
async function redeemHandoff(id: string): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const ok = await fetch(`/api/handoff/${id}`, { method: "DELETE" }).then(
      (response) => response.ok,
      () => false,
    );
    if (ok) return;
  }
  console.warn("Could not redeem the handoff token; it expires with the session");
}

export default function Login() {
  const session = useLoaderData<typeof loader>() as HandoffSession;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isKeyAvailable, setMnemonic } = useKeyStorageContext();
  const { revalidate } = useRevalidator();
  const redirect = searchParams.get("redirect") ?? "/wallet";
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // Let's redirect on mobile devices directly to scan page
    const browser = Bowser.getParser(window.navigator.userAgent);
    const isMobile = browser.getPlatformType(true) === "mobile";

    // oxlint-disable-next-line react/set-state-in-effect
    setIsMobile(isMobile);

    if (isMobile) {
      navigate(`/scan?redirect=${encodeURIComponent(redirect)}`);
    }
  }, []);

  useEffect(() => {
    if (isKeyAvailable) {
      navigate(redirect);
    }
  }, [isKeyAvailable, redirect, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        revalidate();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [revalidate]);

  useEffect(() => {
    if (session?.status === "completed" && session.attestationToken) {
      const { id, attestationToken } = session;
      getEntropy(attestationToken).then((data) => {
        setMnemonic(data.entropy);
        redeemHandoff(id);
      });
    }
  }, [session?.status, session?.attestationToken]);

  if (isMobile === null || isMobile === true) {
    return (
      <div className="bg-background flex h-svh items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div role="dialog" className="bg-background fixed inset-0 flex items-center justify-center p-6">
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- Stop propagation for backdrop dismiss */}
      <div
        className="bg-card relative flex w-full max-w-sm flex-col gap-5 rounded-xl p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center">
          <img alt="idOS FaceSign" src="/facesign-logo.svg" width={130} height={61} />
        </div>

        <div className="text-center">
          <div className="m-auto inline-block rounded-lg bg-white p-4">
            <QRCode value={`https://${window.location.host}/m/${session?.id}`} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-center text-base font-medium">
            Scan QR code with your phone to open idOS FaceSign on mobile
          </h1>
          <p className="text-muted-foreground text-center text-sm">
            Scan the QR code with your smartphone to continue the face scan and verification on your
            mobile.
          </p>
        </div>

        <div className="flex justify-between gap-4">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="min-w-0 flex-1"
            onClick={() => navigate(`/scan?redirect=${encodeURIComponent(redirect)}`)}
          >
            Or continue on this device
          </Button>
        </div>
      </div>
    </div>
  );
}
