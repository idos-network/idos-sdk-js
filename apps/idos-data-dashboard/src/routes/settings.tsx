import { createFileRoute } from "@tanstack/react-router";
import { SettingsSection } from "./dashboard/settings/index";

export const Route = createFileRoute("/settings")({
  component: SettingsSection,
});
