import { ArrowDown, Database, Home, LogOut, Plus, QrCode, Send, User } from "lucide-react";
import { NavLink } from "react-router";
import { useSiwe } from "~/providers/siwe-provider";

const navigation = [
  { name: "Home", href: "/app", icon: Home },
  { name: "Add Funds", href: "/app/add", icon: Plus },
  { name: "Withdraw", href: "/app/withdraw", icon: ArrowDown },
  { name: "Send", href: "/app/send", icon: Send },
  { name: "Receive", href: "/app/receive", icon: QrCode },
  { name: "Profile", href: "/app/profile", icon: User },
];

export function Sidebar() {
  const { signOut } = useSiwe();
  return (
    <div className="hidden w-64 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-2 font-semibold text-lg tracking-tight text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <span className="font-bold">N</span>
          </div>
          NeoFinance
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/app"}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0 text-current" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={() => signOut()}
          className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0 transition-colors group-hover:text-destructive" />
          Logout
        </button>
      </div>
      <div className="border-t border-border p-4 bg-muted/50">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Database className="h-3 w-3" />
          <span className="font-medium">this is a idOS demo</span>
        </div>
      </div>
    </div>
  );
}
