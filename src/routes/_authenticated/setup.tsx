import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { CARD_TYPES, labelOf } from "@/lib/cms-constants";

export const Route = createFileRoute("/_authenticated/setup")({
  component: Setup,
});

function Setup() {
  const { data, isLoading } = useQuery({
    queryKey: ["setup"],
    queryFn: async () => {
      const [products, fees] = await Promise.all([
        supabase.from("card_products").select("*").order("product_name"),
        supabase.from("fee_profiles").select("*").order("profile_name"),
      ]);
      if (products.error) throw products.error;
      return { products: products.data ?? [], fees: fees.data ?? [] };
    },
  });

  return (
    <div>
      <PageHeader
        title="Product & fee setup"
        description="Card products with their BIN and limit bands, and the fee profiles applied at booking."
      />
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <section className="overflow-x-auto rounded-lg border bg-card">
        <h2 className="border-b px-4 py-3 text-sm font-semibold">Card products</h2>
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              {["Product", "Code", "Type", "Scheme", "BIN", "Limit band", "Currency", "Status"].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-2.5 field-label">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {(data?.products ?? []).map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2.5 font-medium">{p.product_name}</td>
                <td className="px-3 py-2.5 mono text-xs">{p.product_code}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{labelOf(CARD_TYPES, p.card_type)}</td>
                <td className="px-3 py-2.5">{p.scheme}</td>
                <td className="px-3 py-2.5 mono text-xs">{p.bin}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-xs">
                  {Number(p.min_limit).toLocaleString()} – {Number(p.max_limit).toLocaleString()}
                </td>
                <td className="px-3 py-2.5">{p.currency}</td>
                <td className="px-3 py-2.5">
                  <Badge variant="outline" className={p.is_active ? "status-success" : "status-neutral"}>
                    {p.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 overflow-x-auto rounded-lg border bg-card">
        <h2 className="border-b px-4 py-3 text-sm font-semibold">Fee profiles</h2>
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              {["Profile", "Code", "Annual fee", "Interest %", "Cash advance %", "Late fee", "Shield %"].map(
                (h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 field-label">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {(data?.fees ?? []).map((f) => (
              <tr key={f.id}>
                <td className="px-3 py-2.5 font-medium">{f.profile_name}</td>
                <td className="px-3 py-2.5 mono text-xs">{f.profile_code}</td>
                <td className="px-3 py-2.5 tabular-nums">{Number(f.annual_fee).toLocaleString()}</td>
                <td className="px-3 py-2.5 tabular-nums">{f.interest_rate}</td>
                <td className="px-3 py-2.5 tabular-nums">{f.cash_advance_rate}</td>
                <td className="px-3 py-2.5 tabular-nums">{Number(f.late_fee).toLocaleString()}</td>
                <td className="px-3 py-2.5 tabular-nums">{f.credit_shield_premium_rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}