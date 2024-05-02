import fractal_id_clients from "./cachedIssuers/fractal_id_clients";
import fractal_id_production from "./cachedIssuers/fractal_id_production";
import fractal_id_staging from "./cachedIssuers/fractal_id_staging";

export const cachedIssuers = {
  "https://vc-issuers.fractal.id/idos": fractal_id_production,
  "https://clients.vc-issuers.fractal.id/idos": fractal_id_clients,
  "https://staging.vc-issuers.fractal.id/idos": fractal_id_staging,
};
