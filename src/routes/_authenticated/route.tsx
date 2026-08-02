import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  // Prototype: no auth gate — every screen is open with mock data.
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}