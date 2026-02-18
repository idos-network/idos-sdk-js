import type { UserItem } from "./providers/store.server";

export interface SessionUser extends UserItem {
  isAuthenticated: boolean;
}
