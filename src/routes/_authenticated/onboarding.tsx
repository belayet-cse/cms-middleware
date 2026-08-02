import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/mock/db";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CARD_TYPES,
  FC_CATEGORIES,
  PAYMENT_INSTRUCTIONS,
  REQUEST_TYPES,
} from "@/lib/cms-constants";
import { createCardRequest, searchCbsCif, submitCardRequest, updateCardRequest } from "@/lib/mock/actions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  validateSearch: (s: Record<string, unknown>) => ({ draft: (s['draft'] as string) || "" }),
  component: Onboarding,
});

const EMPTY = {
  applicant_name: "",
  embossing_name: "",
  mobile: "",
  email: "",
  national_id: "",
  passport_no: "",
  tin: "",
  date_of_birth: "",
  father_name: "",
  mother_name: "",
  gender: "",
  company_name: "",
  address_line1: "",
  address_line2: "",
  city: "",
  postal_code: "",
  request_type: "new_onboarding",
  card_type: "primary_credit",
  product_id: "",
  fee_profile_id: "",
  requested_limit: "",
  payment_instruction: "none",
  fc_category: "none",
  fc_account_no: "",
  use_existing_cif: false,
  existing_cif: "",
  email_tagged: true,
  sms_tagged: true,
  credit_shield: false,
  credit_shield_rate: "",
};

type FormState = typeof EMPTY;

function Onboarding() {
  const navigate = useNavigate();
  const { draft } = Route.useSearch();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [cifQuery, setCifQuery] = useState("");
  const [cifResults, setCifResults] = useState<
    { cif_number: string; full_name: string; mobile: string; national_id?: string | null }[]
  >([]);

  const createFn = createCardRequest;
  const updateFn = updateCardRequest;
  const submitFn = submitCardRequest;
  const searchFn = searchCbsCif;

  const { data: masters } = useQuery({
    queryKey: ["masters"],
    queryFn: async () => {
      const [products, fees] = await Promise.all([
        supabase
          .from("card_products")
          .select("id, product_name, product_code, card_type, scheme, min_limit, max_limit, currency")
          .eq("is_active", true)
          .order("product_name"),
        supabase
          .from("fee_profiles")
          .select("id, profile_name, profile_code, annual_fee, interest_rate, credit_shield_premium_rate")
          .eq("is_active", true)
          .order("profile_name"),
      ]);
      return { products: products.data ?? [], fees: fees.data ?? [] };
    },
  });

  const { data: draftRow } = useQuery({
    queryKey: ["draft-request", draft],
    enabled: !!draft,
    queryFn: async () => {
      const { data, error } = await supabase.from("card_requests").select("*").eq("id", draft!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!draftRow) return;
    setForm((prev) => {
      const next: Record<string, unknown> = { ...prev };
      for (const key of Object.keys(EMPTY)) {
        const value = (draftRow as Record<string, unknown>)[key];
        if (value !== null && value !== undefined) next[key] = typeof value === "number" ? String(value) : value;
      }
      return next as FormState;
    });
  }, [draftRow]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const products = (masters?.products ?? []).filter((p) => p.card_type === form.card_type);
  const selectedProduct = products.find((p) => p.id === form.product_id);

  async function handleCifSearch() {
    try {
      const res = (await searchFn({ data: { query: cifQuery.trim() } })) as never as {
        results: typeof cifResults;
      };
      const list = Array.isArray(res) ? res : (res?.results ?? []);
      setCifResults(list as typeof cifResults);
      if (!list.length) toast.info("No matching CIF found in Core Banking");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function buildPayload() {
    // Prototype: no validation — the form is captured as-is.
    const payload: Record<string, unknown> = { ...form };
    payload['requested_limit'] = Number(form.requested_limit || 0);
    payload['credit_shield_rate'] = form.credit_shield_rate === "" ? null : Number(form.credit_shield_rate);
    for (const key of Object.keys(payload)) {
      if (payload[key] === "") payload[key] = null;
    }
    return payload;
  }

  async function save(submit: boolean) {
    const payload = buildPayload();
    if (!payload) return;
    setBusy(true);
    try {
      let requestId = draft;
      if (requestId) {
        await updateFn({ data: { id: requestId, payload } });
      } else {
        const created = (await createFn({ data: { payload } })) as { id: string };
        requestId = created.id;
      }
      if (submit && requestId) await submitFn({ data: { id: requestId } });
      toast.success(submit ? "Booking submitted to checker" : "Draft saved");
      navigate({ to: "/requests/$id", params: { id: requestId! } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={draft ? "Edit card booking" : "New card booking"}
        description="Capture the customer and card details once — the middleware creates the CIF in Core Banking and the Client ID in the Card Management System after approval."
        actions={
          <>
            <Button variant="outline" disabled={busy} onClick={() => save(false)}>
              Save draft
            </Button>
            <Button disabled={busy} onClick={() => save(true)}>
              Submit to checker
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <section className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">1 · Request</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Request type</Label>
                <Select value={form.request_type} onValueChange={(v) => set("request_type", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Card type</Label>
                <Select
                  value={form.card_type}
                  onValueChange={(v) => {
                    set("card_type", v);
                    set("product_id", "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">2 · Customer</h2>
              <label className="flex items-center gap-2 text-xs font-medium">
                <Checkbox
                  checked={form.use_existing_cif}
                  onCheckedChange={(v) => set("use_existing_cif", Boolean(v))}
                />
                Existing CIF customer
              </label>
            </div>

            {form.use_existing_cif && (
              <div className="mb-4 rounded-md border bg-muted/40 p-3">
                <p className="field-label">Search Core Banking</p>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={cifQuery}
                    onChange={(e) => setCifQuery(e.target.value)}
                    placeholder="CIF, NID or mobile"
                  />
                  <Button type="button" variant="outline" onClick={handleCifSearch}>
                    Search
                  </Button>
                </div>
                {cifResults.length > 0 && (
                  <ul className="mt-3 divide-y rounded-md border bg-card">
                    {cifResults.map((c) => (
                      <li key={c.cif_number} className="flex items-center justify-between gap-2 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{c.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="mono">{c.cif_number}</span> · {c.mobile}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            set("existing_cif", c.cif_number);
                            set("applicant_name", c.full_name);
                            set("mobile", c.mobile);
                            if (c.national_id) set("national_id", c.national_id);
                            toast.success(`CIF ${c.cif_number} attached`);
                          }}
                        >
                          Use
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 space-y-1.5">
                  <Label>Existing CIF number</Label>
                  <Input
                    value={form.existing_cif}
                    onChange={(e) => set("existing_cif", e.target.value)}
                    className="mono"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Applicant name *</Label>
                <Input
                  value={form.applicant_name}
                  onChange={(e) => set("applicant_name", e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Embossing name (max 26)</Label>
                <Input
                  value={form.embossing_name}
                  onChange={(e) => set("embossing_name", e.target.value.toUpperCase())}
                  maxLength={26}
                  className="mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mobile *</Label>
                <Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} maxLength={20} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>National ID</Label>
                <Input value={form.national_id} onChange={(e) => set("national_id", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Passport no.</Label>
                <Input value={form.passport_no} onChange={(e) => set("passport_no", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>TIN</Label>
                <Input value={form.tin} onChange={(e) => set("tin", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Date of birth</Label>
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Father's name</Label>
                <Input value={form.father_name} onChange={(e) => set("father_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Mother's name</Label>
                <Input value={form.mother_name} onChange={(e) => set("mother_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Company (business card)</Label>
                <Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address line 1</Label>
                <Input value={form.address_line1} onChange={(e) => set("address_line1", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address line 2</Label>
                <Input value={form.address_line2} onChange={(e) => set("address_line2", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Postal code</Label>
                <Input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">3 · Card, limit & tagging</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Card product *</Label>
                <Select value={form.product_id} onValueChange={(v) => set("product_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.product_name} · {p.scheme}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct && (
                  <p className="text-xs text-muted-foreground">
                    Limit band: {selectedProduct.currency} {Number(selectedProduct.min_limit).toLocaleString()} –{" "}
                    {Number(selectedProduct.max_limit).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Fee profile *</Label>
                <Select
                  value={form.fee_profile_id}
                  onValueChange={(v) => set("fee_profile_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masters?.fees ?? []).map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.profile_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Requested limit *</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.requested_limit}
                  onChange={(e) => set("requested_limit", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment instruction</Label>
                <Select
                  value={form.payment_instruction}
                  onValueChange={(v) => set("payment_instruction", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_INSTRUCTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>FC category</Label>
                <Select value={form.fc_category} onValueChange={(v) => set("fc_category", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FC_CATEGORIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>FC account no.</Label>
                <Input
                  value={form.fc_account_no}
                  onChange={(e) => set("fc_account_no", e.target.value)}
                  className="mono"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.email_tagged}
                  onCheckedChange={(v) => set("email_tagged", Boolean(v))}
                />
                Email tagging
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.sms_tagged} onCheckedChange={(v) => set("sms_tagged", Boolean(v))} />
                SMS tagging
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.credit_shield}
                  onCheckedChange={(v) => set("credit_shield", Boolean(v))}
                />
                Credit shield
              </label>
              {form.credit_shield && (
                <div className="w-32 space-y-1.5">
                  <Label>Premium %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.credit_shield_rate}
                    onChange={(e) => set("credit_shield_rate", e.target.value)}
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold">What happens next</h2>
            <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>1. Submitted case moves to the checker queue.</li>
              <li>2. On approval the CIF, CMS Client ID and card number are generated.</li>
              <li>3. Checker-1 sets the card and cash limit.</li>
              <li>4. Checker-2 authorises — the case is then synced to CBS and CMS.</li>
            </ol>
          </section>
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold">Data quality</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Mobile and email are validated at entry. Embossing name is limited to 26 characters as
              required by the card personalisation file.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}