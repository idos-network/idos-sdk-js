import { redirect } from "react-router";
import { sessionStorage } from "~/providers/sessions.server";
import { Welcome } from "../welcome/welcome";
import type { Route } from "./+types/home";

export function meta() {
  return [
    { title: "idOS Pay Demo" },
    { name: "description", content: "Welcome to idOS Pay Demo!" },
  ];
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
