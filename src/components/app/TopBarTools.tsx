import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tableRows } from "@/lib/mock/db";
import { formatDateTime } from "@/lib/cms-constants";
import { KIND_LABEL, MAINT_STATUS_LABEL, maintRows, pendingFor, seedMaintenance } from "@/lib/mock/maintenance";
import { setActiveRole, useActiveRole, type ActiveRole } from "@/lib/session-store";

const ROLE_OPTIONS: { value: ActiveRole; label: string }[] = [
  { value: "maker", label: "Maker" },
  { value: "checker1", label: "Checker-1" },
  { value: "checker2", label: "Checker-2" },
  { value: "admin", label: "Admin / MOD" },
];

export function RoleSwitcher() {
  const role = useActiveRole();
  return (
    <Select value={role} onValueChange={(v) => setActiveRole(v as ActiveRole)}>
      <SelectTrigger className="h-8 w-[9.5rem] text-[12px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            Acting as {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cards = tableRows("cards").filter((c) => !c['is_deleted']).slice(0, 40);
  const customers = tableRows("customers").slice(0, 40);
  const requests = tableRows("card_requests").slice(0, 40);

  function go(to: string) {
    setOpen(false);
    navigate({ to });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-full max-w-md items-center gap-2 rounded-md border bg-background px-2.5 text-left text-[12px] text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="size-3.5" />
        Search CIF, Client ID, card number, application ID…
        <kbd className="mono ml-auto rounded border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search by CIF, Client ID, card number or application reference…" />
        <CommandList>
          <CommandEmpty>No matching record.</CommandEmpty>
          <CommandGroup heading="Cards">
            {cards.map((c) => (
              <CommandItem
                key={String(c['id'])}
                value={`${c['masked_number']} ${c['embossing_name']}`}
                onSelect={() => go("/cards")}
              >
                <span className="mono">{String(c['masked_number'])}</span>
                <span className="text-muted-foreground">· {String(c['embossing_name'])}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Customers / CIF">
            {customers.map((c) => (
              <CommandItem
                key={String(c['id'])}
                value={`${c['cif_number']} ${c['cms_client_id']} ${c['full_name']} ${c['national_id']}`}
                onSelect={() => go("/customers")}
              >
                <span className="mono">{String(c['cif_number'] ?? "No CIF")}</span>
                <span className="text-muted-foreground">· {String(c['full_name'])}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Applications">
            {requests.map((r) => (
              <CommandItem
                key={String(r['id'])}
                value={`${r['reference_no']} ${r['applicant_name']}`}
                onSelect={() => go("/requests")}
              >
                <span className="mono">{String(r['reference_no'])}</span>
                <span className="text-muted-foreground">· {String(r['applicant_name'])}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

export function NotificationsBell() {
  seedMaintenance();
  const role = useActiveRole();
  const navigate = useNavigate();
  const maintenance = pendingFor(role);
  const requests = tableRows("card_requests").filter((r) =>
    role === "checker1" || role === "admin"
      ? r['status'] === "pending_checker" || r['status'] === "limit_pending_checker1"
      : role === "checker2"
        ? r['status'] === "limit_pending_checker2"
        : false,
  );
  const failed = maintRows().filter((r) => r.cms_sync === "failed" || r.cbs_sync === "failed");
  const count = maintenance.length + requests.length + failed.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="size-4" />
          {count > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-3 py-2 text-[12px] font-semibold">Pending for you</div>
        <div className="max-h-80 overflow-y-auto">
          {count === 0 && <p className="px-3 py-4 text-[12px] text-muted-foreground">Nothing awaiting your action.</p>}
          {requests.map((r) => (
            <button
              key={String(r['id'])}
              type="button"
              onClick={() => navigate({ to: "/requests" })}
              className="block w-full border-b px-3 py-2 text-left hover:bg-muted"
            >
              <p className="mono text-[11px] font-semibold">{String(r['reference_no'])}</p>
              <p className="text-[11px] text-muted-foreground">Card application · {String(r['applicant_name'])}</p>
            </button>
          ))}
          {maintenance.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => navigate({ to: "/reports" })}
              className="block w-full border-b px-3 py-2 text-left hover:bg-muted"
            >
              <p className="mono text-[11px] font-semibold">{m.reference_no}</p>
              <p className="text-[11px] text-muted-foreground">
                {KIND_LABEL[m.kind]} · {MAINT_STATUS_LABEL[m.status]} · {formatDateTime(m.created_at)}
              </p>
            </button>
          ))}
          {failed.map((m) => (
            <button
              key={`f-${m.id}`}
              type="button"
              onClick={() => navigate({ to: "/reports" })}
              className="block w-full border-b px-3 py-2 text-left hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="status-danger text-[10px]">Sync failed</Badge>
                <span className="mono text-[11px]">{m.reference_no}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{m.sync_error}</p>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
