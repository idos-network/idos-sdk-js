import { idOSConsumer as idOSConsumerClass } from "@idos-network/consumer";
import * as Sentry from "@sentry/react-router";
import nacl from "tweetnacl";

import { getDb } from "@/core/db.server";
import { COMMON_ENV } from "@/core/envFlags.common";
import { getUserId, sessionStorage } from "@/core/sessions.server";
import { claimRows } from "@/lib/claims";
import { safeParse } from "@/lib/credential-utils";

import type { Route } from "./+types/developer-credentials";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const userId = getUserId(session);

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getDb().user.findUnique({
    where: { id: userId },
  });

  if (!user?.consumerAuthKey || !user.consumerEncKey) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const consumerSigner = nacl.sign.keyPair.fromSecretKey(Buffer.from(user.consumerAuthKey, "hex"));

  const consumer = await idOSConsumerClass.init({
    nodeUrl: COMMON_ENV.DEVELOPER_CONSOLE_IDOS_NODE_URL,
    consumerSigner,
    recipientEncryptionPrivateKey: user.consumerEncKey,
  });

  try {
    const grants = await consumer.getAccessGrants({
      page: 1,
      size: 5,
    });

    const credentials = await Promise.all(
      grants.grants.map(async (grant) => {
        try {
          // Claims live in the public notes, so they need no decryption.
          const [credential, data] = await Promise.all([
            consumer.getCredentialSharedFromIDOS(grant.data_id),
            consumer
              .getCredentialSharedContentDecrypted(grant.data_id)
              .then((content) => JSON.parse(content)),
          ]);

          const publicNotes = safeParse(credential?.public_notes);
          return {
            id: data.id,
            level: typeof publicNotes.level === "string" ? publicNotes.level : undefined,
            claims: claimRows(publicNotes),
            firstName: data.credentialSubject.firstName,
            lastName: data.credentialSubject.lastName,
          };
        } catch (error) {
          Sentry.captureException(error);
          console.error("Failed to fetch credential:", error);
          return null;
        }
      }),
    ).then((results) => results.filter((result) => result !== null));

    return Response.json({ credentials });
  } catch (error) {
    Sentry.captureException(error);
    console.error("Failed to fetch access grants:", error);
    return Response.json({ error: "Failed to load credentials" }, { status: 500 });
  }
}
