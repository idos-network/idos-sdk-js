import {
  getLeaderboardCheckpointUserPosition,
  getUserByEvmAddress,
} from "@/core/db/leaderboard.queries.server";
import { SERVER_ENV } from "@/core/envFlags.server";

import type { Route } from "./+types/leaderboard-position";

export async function loader({ request }: Route.LoaderArgs) {
  if (!SERVER_ENV.LEGACY_APP_DB_URL) {
    return Response.json(null);
  }

  const url = new URL(request.url);
  const address = url.searchParams.get("address");
  const epoch = Number(url.searchParams.get("epoch"));

  if (!address || Number.isNaN(epoch) || epoch <= 0) {
    return Response.json(null);
  }

  const userId = await getUserByEvmAddress(address);
  if (!userId) {
    return Response.json(null);
  }

  const position = await getLeaderboardCheckpointUserPosition(userId, epoch);
  return Response.json(position);
}
