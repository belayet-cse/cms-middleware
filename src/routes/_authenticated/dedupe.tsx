import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DEDUPE_ACTIONS, DEDUPE_KEYS, type DedupeAction, type DedupeKey } from "@/lib/cms-fields";
import { runDedupe, type DedupeResult, type PartyInfo } from "@/lib/mock/dedupe";

export const Route = createFileRoute("/_authenticated/dedupe")({
  head: () => ({
    meta: [
      { title: "Customer Dedupe Search — CBS & CMS" },
      {
        name: "description",
        content:
          "Search Core Banking and Tranzware CMS in one shot by NID, e-TIN, passport, mobile, birth certificate, account or name before creating a CIF and Client ID.",
      },
      { property: "og:title", content: "Customer Dedupe Search — CBS & CMS" },
      {
        property: "og:description",
        content: "Single dedupe check across CBS and CMS with recommended CIF / Client ID action.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DedupePage,
});

const ROWS: { label: string; get: (p: PartyInfo) => string }[] = [
  { label: "Name", get: (p) => p.full_name },
  { label: "Date of Birth", get: (p) => p.date_of_birth },
  { label: "Mobile", get: (p) => p.mobile },
  { label: "NID", get: (p) => p.national_id },
  { label: "Birth Certificate", get: (p) => p.birth_certificate },
  { label: "e-TIN", get: (p) => p.tin },
  { label: "Passport", get: (p) => p.passport_no },
  { label: "A/C No.", get: (p) => p.account_no },
  { label: "E-mail", get: (p) => p.email },
  { label: "Present Address", get: (p) => p.present_address },
];

function InfoPanel({
  system,
  idLabel,
  idValue,
  party,
}: {
  system: string;
  idLabel: string;
  idValue: string;
  party: PartyInfo | null;
}) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <h2 className="text-sm font-semibold">{system} Info</h2>
        <Badge variant={party ? "secondary" : "outline"} className="text-[10px] uppercase tracking-wide">
          {party ? "Match found" : "Not found"}
        </Badge>
      </header>
      <dl className="divide-y">
        <div className="grid grid-cols-[9rem_1fr] gap-2 bg-muted/40 px-4 py-2">
          <dt className="field-label">{idLabel}</dt>
          <dd className="mono text-sm font-semibold">{idValue || "—"}</dd>
        </div>
        {ROWS.map((row) => (
          <div key={row.label} className="grid grid-cols-[9rem_1fr] gap-2 px-4 py-2">
            <dt className="field-label">{row.label}</dt>
            <dd className="text-sm break-words">{(party && row.get(party)) || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function DedupePage() {
  const navigate = useNavigate();
  const [key, setKey] = useState<DedupeKey>("nid");
  const [value, setValue] = useState("");
  const [dob, setDob] = useState("");
  const [applicantRef, setApplicantRef] = useState("");
  const [result, setResult] = useState<DedupeResult | null>(null);

  const active = DEDUPE_KEYS.find((k) => k.value === key)!;
  const needsDob = key === "nid" || key === "brc" || key === "name";

  function search() {
    if (!value.trim()) {
      toast.info("Enter a search value");
      return;
    }
    const res = runDedupe(key, value, dob);
    setResult(res);
    toast.success(
      res.cbs || res.cms
        ? `Dedupe complete — ${res.cbs ? "CBS match" : "no CBS match"}, ${res.cms ? "CMS match" : "no CMS match"}`
        : "No record found in CBS or CMS — new customer",
    );
  }

  function reset() {
    setValue("");
    setDob("");
    setApplicantRef("");
    setResult(null);
  }

  function proceed(action: DedupeAction) {
    navigate({
      to: "/client",
      search: {
        action,
        cif: result?.cbs?.cif_number ?? "",
        client: result?.cms?.client_id ?? "",
        ref: applicantRef,
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Dedupe search — customer onboarding"
        description="One search hits Core Banking and Tranzware CMS together. The middleware then creates the CIF and the Client ID simultaneously where they do not exist, and only updates data where they already do."
      />

      <section className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap gap-1.5">
          {DEDUPE_KEYS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => {
                setKey(k.value);
                setValue("");
              }}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                key === k.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {k.label}
              <span className={`ml-1.5 ${key === k.value ? "opacity-80" : "text-muted-foreground"}`}>
                {k.hint}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>{active.label}</Label>
            <Input
              value={value}
              maxLength={active.maxLength}
              onChange={(e) => setValue(e.target.value)}
              placeholder={active.hint}
              className="mono"
            />
          </div>
          {needsDob && (
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Applicant Ref. No.</Label>
            <Input
              value={applicantRef}
              onChange={(e) => setApplicantRef(e.target.value)}
              placeholder="Application reference"
              className="mono"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={search}>Search</Button>
            <Button variant="outline" onClick={reset}>
              Reset
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <InfoPanel
          system="CBS"
          idLabel="CIF No. / Client"
          idValue={result?.cbs?.cif_number ?? ""}
          party={result?.cbs ?? null}
        />
        <InfoPanel
          system="CMS"
          idLabel="Client ID"
          idValue={result?.cms?.client_id ?? ""}
          party={result?.cms ?? null}
        />
      </div>

      <section className="mt-4 rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold">Onboarding action</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {result
            ? "The highlighted action is recommended from the dedupe outcome. Any action can be taken manually."
            : "Run a dedupe search to enable the onboarding actions."}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {DEDUPE_ACTIONS.map((a) => {
            const recommended = result?.action === a.value;
            return (
              <button
                key={a.value}
                type="button"
                disabled={!result}
                onClick={() => proceed(a.value)}
                className={`rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  recommended ? "border-primary bg-primary/5" : "hover:bg-muted"
                }`}
              >
                <p className="text-sm font-semibold">{a.label}</p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{a.when}</p>
                {recommended && (
                  <Badge className="mt-2 text-[10px] uppercase tracking-wide">Recommended</Badge>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}