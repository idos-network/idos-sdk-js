import { ArrowDownLeft, ArrowUpRight, ScanLine, Wallet } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/app";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "NeoFinance | idOS Demo" }];
}

const stats = [
  { title: "Total Balance", value: "$45,231.89", change: "+20.1% from last month", icon: Wallet },
  {
    title: "Monthly Spending",
    value: "$2,350.00",
    change: "+4% from last month",
    icon: ArrowUpRight,
    iconClass: "text-destructive",
  },
  {
    title: "Income",
    value: "$12,234.00",
    change: "+12% from last month",
    icon: ArrowDownLeft,
    iconClass: "text-success-foreground",
  },
  { title: "Active Cards", value: "3", change: "2 Physical, 1 Virtual", icon: ScanLine },
];

const transactions = [
  { name: "Olivia Martin", email: "olivia.martin@email.com", amount: "+$1,999.00", initials: "OM" },
  { name: "Jackson Lee", email: "jackson.lee@email.com", amount: "+$39.00", initials: "JL" },
  {
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    amount: "-$299.00",
    initials: "IN",
  },
  { name: "William Kim", email: "will@email.com", amount: "+$99.00", initials: "WK" },
  { name: "Sofia Davis", email: "sofia.davis@email.com", amount: "+$39.00", initials: "SD" },
];

const barHeights = [40, 65, 30, 80, 55, 90, 40, 70, 50, 60, 75, 50];

export default function App() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Overview of your financial activity.</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex justify-end">
          <Button variant="outline">Download Report</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.iconClass ?? "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-7">
          <Card className="lg:col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Your spending patterns over the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="flex h-[300px] items-end justify-between gap-2 px-4 pb-4">
                {barHeights.map((h, i) => (
                  <div
                    key={`bar-${i}`}
                    className="group relative flex w-full cursor-pointer flex-col justify-end gap-2 transition-opacity hover:opacity-80"
                  >
                    <div style={{ height: `${h}%` }} className="w-full rounded-t-md bg-primary" />
                    <span className="absolute -bottom-4 left-0 right-0 text-center text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>You made 265 transactions this month.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {transactions.map((tx) => (
                  <div key={tx.email} className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                        <span className="text-xs font-medium text-foreground">{tx.initials}</span>
                      </div>
                      <div className="min-w-0 grid gap-0.5">
                        <p className="truncate text-sm font-medium leading-none text-foreground">
                          {tx.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{tx.email}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-medium text-foreground">{tx.amount}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
