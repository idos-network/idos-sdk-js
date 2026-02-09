import { createFileRoute } from "@tanstack/react-router";
import { SettingsSection } from "./settings/index";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsSection,
});
