import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/mock/db";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeCardStatusFn } from "@/lib/mock/actions";
import { CARD_TYPES, formatAmount, formatDateTime, labelOf } from "@/lib/cms-constants";

export const Route = createFileRoute("/_authenticated/cards")({
  component: CardPortfolio,
});

const STATUS_ACTIONS = [
  { value: "active", label: "Activate" },
  { value: "inactive", label: "Deactivate" },
  { value: "blocked", label: "Block" },
  { value: "hotlisted", label: "Hotlist" },
  { value: "closed", label: "Close" },
] as const;

function CardPortfolio() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const changeStatus = changeCardStatusFn;

  const { data, isLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select(
          "id, masked_number, embossing_name, card_type, status, card_limit, cash_limit, expiry_month, expiry_year, cbs_sync, cms_sync, created_at, customers(full_name, cif_number)",
        )
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: (vars: { cardId: string; status: string }) =>
      changeStatus({ data: { cardId: vars.cardId, status: vars.status as never } }),
    onSuccess: () => {
      toast.success("Card status updated and queued for sync");
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const term = search.trim().toLowerCase();
  const rows = (data ?? []).filter(
    (c) =>
      !term ||
      c.masked_number.toLowerCase().includes(term) ||
      c.embossing_name.toLowerCase().includes(term) ||
      (c.customers?.full_name ?? "").toLowerCase().includes(term),
  );

  return (
    <div>
      <PageHeader
        title="Card portfolio"
        description="Issued cards with their limits, lifecycle status and synchronisation state across CBS and CMS."
      />
      <Input
        placeholder="Search card number, embossing or customer"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              {["Card number", "Customer", "Type", "Limit", "Cash", "Expiry", "Status", "Sync", "Action"].map(
                (h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 field-label">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-muted-foreground">
                  No cards issued yet. Completed bookings appear here.
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-accent/40">
                <td className="whitespace-nowrap px-3 py-2.5 mono">{c.masked_number}</td>
                <td className="px-3 py-2.5">
                  <p className="font-medium">{c.customers?.full_name ?? c.embossing_name}</p>
                  <p className="mono text-xs text-muted-foreground">{c.customers?.cif_number ?? "—"}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">{labelOf(CARD_TYPES, c.card_type)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{formatAmount(c.card_limit)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{formatAmount(c.cash_limit)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 mono text-xs">
                  {String(c.expiry_month).padStart(2, "0")}/{c.expiry_year}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={c.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs">
                  <span className="text-muted-foreground">CBS</span> {c.cbs_sync} ·{" "}
                  <span className="text-muted-foreground">CMS</span> {c.cms_sync}
                </td>
                <td className="px-3 py-2.5">
                  {auth.canCheck ? (
                    <Select
                      value=""
                      onValueChange={(v) => mutation.mutate({ cardId: c.id, status: v })}
                    >
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_ACTIONS.filter((a) => a.value !== c.status).map((a) => (
                          <SelectItem key={a.value} value={a.value}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(c.created_at)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mutation.isPending && <p className="mt-3 text-xs text-muted-foreground">Updating…</p>}
      <Button variant="outline" size="sm" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["cards"] })}>
        Refresh
      </Button>
    </div>
  );
}