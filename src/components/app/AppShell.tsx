import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  FilePlus2,
  ListChecks,
  Gauge,
  CreditCard,
  Users2,
  UploadCloud,
  SearchCheck,
  UserPlus,
  Settings2,
  ShieldCheck,
  ScrollText,
  Activity,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/mock/db";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/lib/cms-constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import mtbLogo from "@/assets/mtb-logo.png.asset.json";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  show?: (a: ReturnType<typeof useAuth>) => boolean;
};

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Operations",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dedupe", label: "Dedupe Search", icon: SearchCheck, show: (a) => a.canMake },
      { to: "/client", label: "CIF & Client ID", icon: UserPlus, show: (a) => a.canMake },
      { to: "/onboarding", label: "New Booking", icon: FilePlus2, show: (a) => a.canMake },
      { to: "/requests", label: "Request Queue", icon: ListChecks },
      { to: "/limits", label: "Limit Control", icon: Gauge, show: (a) => a.canCheck },
      { to: "/bulk", label: "Bulk Upload", icon: UploadCloud, show: (a) => a.canMake },
    ],
  },
  {
    group: "Master Data",
    items: [
      { to: "/cards", label: "Card Portfolio", icon: CreditCard },
      { to: "/customers", label: "Customers / CIF", icon: Users2 },
      { to: "/setup", label: "Product & Fee Setup", icon: Settings2 },
    ],
  },
  {
    group: "Governance",
    items: [
      { to: "/audit", label: "Audit Trail", icon: ScrollText },
      { to: "/integration", label: "Integration Monitor", icon: Activity },
      { to: "/users", label: "Users & Roles", icon: ShieldCheck, show: (a) => a.isAdmin },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const roleLabels = auth.roles.map((r) => ROLES.find((x) => x.value === r)?.label ?? r);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="brand-rule" />
        <div className="border-b border-sidebar-border px-5 py-4">
          <div className="mb-3 inline-flex rounded-md bg-white px-2.5 py-1.5">
            <img src={mtbLogo.url} alt="Mutual Trust Bank PLC logo" className="h-7 w-auto" />
          </div>
          <p className="text-sm font-bold tracking-tight text-sidebar-accent-foreground">
            CMS Middleware
          </p>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-sidebar-foreground/60">
            CBS ↔ Tranzware CMS
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((group) => {
            const items = group.items.filter((i) => !i.show || i.show(auth));
            if (!items.length) return null;
            return (
              <div key={group.group} className="mb-5">
                <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
                  {group.group}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors ${
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        <item.icon className="size-4" strokeWidth={active ? 2.4 : 1.8} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-3 text-[11px] text-sidebar-foreground/60">
          Mutual Trust Bank PLC · Card Operations
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b bg-card px-5 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {auth.profile?.['full_name'] || auth.user?.email}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {roleLabels.length ? (
                roleLabels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-[10px] uppercase tracking-wide">
                    {label}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  No role assigned
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/requests" className="lg:hidden">
              <Button variant="outline" size="sm">
                Queue
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1.5 size-3.5" /> Sign out
            </Button>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}