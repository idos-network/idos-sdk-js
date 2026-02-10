import { createFileRoute } from "@tanstack/react-router";
import { CredentialsSection } from "./dashboard/credentials";

export const Route = createFileRoute("/credentials")({
  component: CredentialsSection,
});
