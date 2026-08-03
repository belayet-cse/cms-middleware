import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CLIENT_SECTIONS,
  DEDUPE_ACTIONS,
  type DedupeAction,
  type FieldDef,
} from "@/lib/cms-fields";
import { CBS_REGISTRY, CMS_REGISTRY, onboardClient, type OnboardOutcome } from "@/lib/mock/dedupe";
import { mockClientRecord } from "@/lib/mock/client-mock";

export const Route = createFileRoute("/_authenticated/client")({
  validateSearch: (s: Record<string, unknown>) => ({
    action: ((s['action'] as string) || "create_cif_client") as DedupeAction,
    cif: (s['cif'] as string) || "",
    client: (s['client'] as string) || "",
    ref: (s['ref'] as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "CIF & Client ID Creation — Customer Onboarding" },
      {
        name: "description",
        content:
          "Capture the complete Tranzware CMS client record once: general, address, contact, tax, employment and card administration fields for simultaneous CIF and Client ID creation.",
      },
      { property: "og:title", content: "CIF & Client ID Creation — Customer Onboarding" },
      {
        property: "og:description",
        content: "Full CMS client field set for one-shot CIF and Client ID onboarding.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClientOnboarding,
});

type Form = Record<string, string | boolean>;

function initialForm(): Form {
  // Prototype: every field starts pre-filled with mock data.
  return { ...mockClientRecord(CLIENT_SECTIONS) };
}

function ClientOnboarding() {
  const navigate = useNavigate();
  const { action, cif, client, ref } = Route.useSearch();
  const [activeSection, setActiveSection] = useState(CLIENT_SECTIONS[0]!.id);
  const [outcome, setOutcome] = useState<OnboardOutcome | null>(null);

  const [form, setForm] = useState<Form>(() => {
    const base = initialForm();
    const cbs = CBS_REGISTRY.find((p) => p.cif_number === cif);
    const cms = CMS_REGISTRY.find((p) => p.client_id === client);
    const src = cbs ?? cms;
    if (src) {
      base['full_name'] = src.full_name;
      base['first_name'] = src.full_name.split(" ").slice(0, -1).join(" ") || src.full_name;
      base['last_name'] = src.full_name.split(" ").slice(-1).join(" ");
      base['name_transliteration'] = src.full_name;
      base['name_on_card'] = src.full_name;
      base['date_of_birth'] = src.date_of_birth;
      base['mobile'] = src.mobile;
      base['email'] = src.email;
      base['national_id'] = src.national_id;
      base['birth_certificate'] = src.birth_certificate;
      base['tin'] = src.tin;
      base['passport_no'] = src.passport_no;
      base['present_line1'] = src.present_address;
      base['correspondence_address'] = src.present_address;
      base['personal_code'] = src.national_id;
      if (src.date_of_birth) {
        base['age'] = String(
          Math.max(0, new Date().getFullYear() - new Date(src.date_of_birth).getFullYear()),
        );
      }
    }
    if (ref) base['application_ref_no'] = ref;
    if (cif) base['cms_cif_number'] = cif;
    if (client) base['cms_client_id'] = client;
    base['country'] = "BANGLADESH (50)";
    base['nationality'] = "BANGLADESH";
    base['resident'] = "Resident";
    base['communication_address'] = "Present Address";
    return base;
  });

  const actionMeta = DEDUPE_ACTIONS.find((a) => a.value === action)!;
  const section = CLIENT_SECTIONS.find((s) => s.id === activeSection)!;

  const completion = useMemo(() => {
    const required = CLIENT_SECTIONS.flatMap((s) => s.fields.filter((f) => f.required));
    const filled = required.filter((f) => {
      const v = form[f.name];
      return typeof v === "boolean" ? v : String(v ?? "").trim().length > 0;
    });
    return { total: required.length, filled: filled.length };
  }, [form]);

  function set(name: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function submit() {
    const payload: Record<string, unknown> = { ...form, cif_number: cif, client_id: client };
    const res = onboardClient(action, payload);
    setOutcome(res);
    toast.success(
      `${res.cif_created ? "CIF created" : "CIF updated"} · ${res.client_created ? "Client ID created" : "Client ID updated"}`,
    );
  }

  function renderField(field: FieldDef) {
    const value = form[field.name];
    const label = (
      <Label className="flex flex-wrap items-center gap-1.5">
        {field.label}
        {field.required && <span className="text-destructive">*</span>}
        {field.cms && (
          <span className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
            {field.cms}
          </span>
        )}
      </Label>
    );

    if (field.type === "checkbox") {
      return (
        <label
          key={field.name}
          className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-[13px] font-medium sm:col-span-2"
        >
          <Checkbox checked={Boolean(value)} onCheckedChange={(v) => set(field.name, Boolean(v))} />
          {field.label}
        </label>
      );
    }

    return (
      <div key={field.name} className={`space-y-1.5 ${field.wide ? "sm:col-span-2" : ""}`}>
        {label}
        {field.type === "select" ? (
          <Select value={String(value ?? "")} onValueChange={(v) => set(field.name, v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
            value={String(value ?? "")}
            placeholder={field.placeholder}
            onChange={(e) => set(field.name, e.target.value)}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="CIF & Client ID creation for customer"
        description="Complete Tranzware CMS client record. On submit the middleware writes to Core Banking and CMS simultaneously — creating what is missing and updating what already exists."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate({ to: "/dedupe" })}>
              Back to dedupe
            </Button>
            <Button onClick={submit}>Submit</Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-card px-4 py-3">
        <Badge className="text-[10px] uppercase tracking-wide">{actionMeta.label}</Badge>
        <span className="text-xs text-muted-foreground">
          CBS CIF: <span className="mono">{cif || "will be generated"}</span> · CMS Client ID:{" "}
          <span className="mono">{client || "will be generated"}</span>
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          Mandatory fields completed:{" "}
          <span className="font-semibold text-foreground">
            {completion.filled}/{completion.total}
          </span>
        </span>
      </div>

      {outcome && (
        <div className="mb-4 rounded-lg border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm font-semibold">Onboarding completed</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {outcome.cif_created ? "CIF created in CBS" : "CIF updated in CBS"}:{" "}
            <span className="mono font-semibold text-foreground">{outcome.cif_number}</span> ·{" "}
            {outcome.client_created ? "Client ID created in CMS" : "Client ID updated in CMS"}:{" "}
            <span className="mono font-semibold text-foreground">{outcome.client_id}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => navigate({ to: "/onboarding", search: { draft: "" } })}
            >
              Continue to card booking
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate({ to: "/customers" })}>
              View customer record
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate({ to: "/integration" })}>
              View CBS / CMS calls
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
        <nav className="flex gap-1.5 overflow-x-auto rounded-lg border bg-card p-2 lg:flex-col lg:overflow-visible">
          {CLIENT_SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={`shrink-0 rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                s.id === activeSection ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <span className="mono mr-2 text-[11px] opacity-70">{i + 1}</span>
              {s.title}
            </button>
          ))}
        </nav>

        <section className="rounded-lg border bg-card p-4">
          <header className="mb-4 border-b pb-3">
            <h2 className="text-sm font-semibold">{section.title}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{section.caption}</p>
          </header>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {section.fields.map(renderField)}
          </div>
          <div className="mt-5 flex flex-wrap justify-between gap-2 border-t pt-4">
            <Button
              variant="outline"
              disabled={section.id === CLIENT_SECTIONS[0]!.id}
              onClick={() => {
                const i = CLIENT_SECTIONS.findIndex((s) => s.id === section.id);
                setActiveSection(CLIENT_SECTIONS[Math.max(0, i - 1)]!.id);
              }}
            >
              Previous
            </Button>
            {section.id === CLIENT_SECTIONS[CLIENT_SECTIONS.length - 1]!.id ? (
              <Button onClick={submit}>Submit to CBS & CMS</Button>
            ) : (
              <Button
                onClick={() => {
                  const i = CLIENT_SECTIONS.findIndex((s) => s.id === section.id);
                  setActiveSection(CLIENT_SECTIONS[Math.min(CLIENT_SECTIONS.length - 1, i + 1)]!.id);
                }}
              >
                Next
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}