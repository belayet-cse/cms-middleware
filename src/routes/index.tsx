import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MTB_CREDIT_CARDS } from "@/lib/mtb-cards";
import mtbLogo from "@/assets/mtb-logo.png.asset.json";
import mtbSwoosh from "@/assets/mtb-swoosh.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CMS Middleware — CBS to CMS Card Management" },
      {
        name: "description",
        content:
          "Middleware for customer onboarding and end-to-end card booking between Core Banking and the Tranzware Card Management System, with maker-checker control and full audit trail.",
      },
      { property: "og:title", content: "CMS Middleware — CBS to CMS Card Management" },
      {
        property: "og:description",
        content:
          "Middleware for customer onboarding and end-to-end card booking between Core Banking and the Tranzware Card Management System, with maker-checker control and full audit trail.",
      },
    ],
  }),
  component: Landing,
});

const CAPABILITIES = [
  {
    title: "Customer onboarding",
    body: "Search or create a CIF once. The middleware creates the CIF in Core Banking and the Client ID in the Card Management System, then keeps both in step.",
  },
  {
    title: "End-to-end card booking",
    body: "Product type, fee profile, card number generation, email and SMS tagging, payment instruction and credit shield in a single case file.",
  },
  {
    title: "Maker-checker control",
    body: "Maker submits, Checker approves, Checker-1 sets the limit and Checker-2 authorises it — with segregation of duty enforced server-side.",
  },
  {
    title: "Governance & reporting",
    body: "Every sync, data change and approval is recorded in an immutable audit trail with an integration monitor for failures and exceptions.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="brand-header text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex rounded-md bg-white px-2.5 py-1.5">
              <img src={mtbLogo.url} alt="Mutual Trust Bank PLC logo" className="h-7 w-auto" />
            </span>
            <span className="hidden text-sm font-bold text-sidebar-accent-foreground sm:inline">
              CMS Middleware
            </span>
          </div>
          <Link to="/auth">
            <Button size="sm">Staff sign in</Button>
          </Link>
        </div>
        <div className="relative mx-auto max-w-6xl overflow-hidden px-6 pb-16 pt-10">
          <img
            src={mtbSwoosh.url}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-6 w-[40rem] opacity-15"
          />
          <p className="field-label relative text-sidebar-primary">Card Operations Platform</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-[1.1] text-sidebar-accent-foreground sm:text-5xl">
            One workflow from customer onboarding to an issued card number.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-sidebar-foreground/80">
            The middleware bridges the Core Banking System and the Tranzware Card Management System —
            removing duplicate entry, enforcing maker-checker control and synchronising customer and
            card data in real time for accurate CIB reporting.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth">
              <Button size="lg">Open the middleware</Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="secondary">
                Register staff account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-lg font-semibold">MTB credit card line-up</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Every product below is bookable through the middleware — product type, fee profile and
          limit band flow straight into the Card Management System.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MTB_CREDIT_CARDS.map((c) => (
            <article key={c.name} className="card-tile overflow-hidden rounded-xl border bg-card">
              <div className="bg-muted/60 p-5">
                <img
                  src={c.image}
                  alt={`${c.name} card face`}
                  loading="lazy"
                  className="mx-auto h-40 w-full rounded-lg object-contain"
                />
              </div>
              <div className="border-t p-5">
                <div className="flex items-center gap-2">
                  <span className="field-label text-primary">{c.scheme}</span>
                  <span className="rounded-full border bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                    {c.tier}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold">{c.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.blurb}</p>
              </div>
            </article>
          ))}
        </div>

        <h2 className="mt-14 text-lg font-semibold">What the middleware handles</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {CAPABILITIES.map((c) => (
            <article key={c.title} className="rounded-lg border bg-card p-5">
              <h3 className="text-sm font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-lg border bg-card p-6">
          <h2 className="text-sm font-semibold">Approval chain</h2>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            {[
              "Maker captures CIF + booking",
              "Checker validates & approves",
              "CIF, Client ID & card number generated",
              "Checker-1 sets limit",
              "Checker-2 authorises",
              "Synced to CBS & CMS",
            ].map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-md border bg-secondary px-2.5 py-1.5 font-medium text-secondary-foreground">
                  {i + 1}. {step}
                </span>
                {i < 5 && <span className="text-muted-foreground">→</span>}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="brand-rule" />
      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        Card Operations · Internal use only
      </footer>
    </div>
  );
}
