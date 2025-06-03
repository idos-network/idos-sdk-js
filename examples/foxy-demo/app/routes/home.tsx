import { redirect } from "react-router";
import { sessionStorage } from "~/providers/sessions.server";
import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";

// biome-ignore lint/correctness/noEmptyPattern: <explanation>
export function meta({}: Route.MetaArgs) {
  return [{ title: "Foxy Demo" }, { name: "description", content: "Welcome to Foxy Demo!" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (user?.isAuthenticated) {
    throw redirect("/app");
  }

  return null;
}

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Welcome />
    </div>
  );
}
