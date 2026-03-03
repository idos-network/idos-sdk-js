import { useEffect } from "react";
import QRCode from "react-qr-code";
import {
  redirect,
  useLoaderData,
  useNavigate,
  useRevalidator,
  useSearchParams,
} from "react-router";
import { Button } from "@/components/ui/button";
import { getEntropy } from "@/lib/api";
import { createSession, getSession, type HandoffSession } from "@/lib/handoff-store";
import { sessionStorage } from "@/lib/sessions.server";
import { useKeyStorageContext } from "@/providers/key.provider";
import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  const isMobile =
    request.headers.get("Sec-CH-UA-Mobile") === "?1" ||
    /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|Opera Mini|IEMobile/i.test(
      request.headers.get("User-Agent") ?? "",
    );

  if (isMobile) {
    const url = new URL(request.url);
    const redirectParam = url.searchParams.get("redirect");
    const target = redirectParam ? `/scan?redirect=${encodeURIComponent(redirectParam)}` : "/scan";
    throw redirect(target);
  }

  const sessionData = await sessionStorage.getSession(request.headers.get("Cookie"));

  let session: HandoffSession | null | undefined;
  const sessionId = sessionData.get("sessionId");
  if (sessionId) {
    session = await getSession(sessionId);
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

export default function Login() {
  const session = useLoaderData<typeof loader>() as HandoffSession;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isKeyAvailable, setMnemonic } = useKeyStorageContext();
  const { revalidate } = useRevalidator();

  const redirect = searchParams.get("redirect") ?? "/wallet";

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
      getEntropy(session.attestationToken).then((data) => {
        setMnemonic(data.entropy);
      });
    }
  }, [session]);

  return (
    <div role="dialog" className="fixed inset-0 flex items-center justify-center bg-background p-6">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: stop propagation for backdrop dismiss */}
      <div
        className="relative flex w-full max-w-sm flex-col gap-5 rounded-xl bg-card p-6 shadow-xl"
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
          <h1 className="text-center font-medium text-base">
            Scan QR code with your phone to open idOS FaceSign on mobile
          </h1>
          <p className="text-center text-muted-foreground text-sm">
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
            onClick={() => navigate("/scan")}
          >
            Or continue on this device
          </Button>
        </div>
      </div>
    </div>
  );
}
