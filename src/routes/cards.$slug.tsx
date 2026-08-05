import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MTB_CREDIT_CARDS, getMtbCard, type MtbCard } from "@/lib/mtb-cards";
import mtbLogo from "@/assets/mtb-logo.png.asset.json";
import mtbSwoosh from "@/assets/mtb-swoosh.png.asset.json";

export const Route = createFileRoute("/cards/$slug")({
  loader: ({ params }): { card: MtbCard } => {
    const card = getMtbCard(params.slug);
    if (!card) throw notFound();
    return { card };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Card not found — CMS Middleware" }, { name: "robots", content: "noindex" }],
      };
    }
    const { card } = loaderData;
    const title = `${card.name} — Features & Eligibility`;
    const description = `${card.blurb} Limit band ${card.limitBand}. Key features and eligibility criteria for the ${card.name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:image", content: card.image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: card.image },
      ],
    };
  },
  notFoundComponent: CardNotFound,
  component: CardDetail,
});

function CardNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Card not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        That product is not part of the MTB credit card line-up.
      </p>
      <Link to="/" className="mt-6 inline-block">
        <Button variant="secondary">Back to the line-up</Button>
      </Link>
    </div>
  );
}

function CardDetail() {
  const { card } = Route.useLoaderData();
  const others = MTB_CREDIT_CARDS.filter((c) => c.slug !== card.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <header className="brand-header text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="inline-flex rounded-md bg-white px-2.5 py-1.5">
              <img src={mtbLogo.url} alt="Mutual Trust Bank PLC logo" className="h-7 w-auto" />
            </span>
            <span className="hidden text-sm font-bold text-sidebar-accent-foreground sm:inline">
              CMS Middleware
            </span>
          </Link>
          <Link to="/auth">
            <Button size="sm">Staff sign in</Button>
          </Link>
        </div>

        <div className="relative mx-auto max-w-6xl overflow-hidden px-6 pb-14 pt-8">
          <img
            src={mtbSwoosh.url}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-6 w-[40rem] opacity-15"
          />
          <div className="relative grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="field-label text-sidebar-primary">
                {card.scheme} · {card.tier}
              </p>
              <h1 className="mt-3 text-3xl font-bold leading-tight text-sidebar-accent-foreground sm:text-4xl">
                {card.name}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-sidebar-foreground/80">
                {card.blurb}
              </p>
              <dl className="mt-6 inline-flex flex-col rounded-lg bg-white/10 px-4 py-3">
                <dt className="field-label text-sidebar-primary">Indicative limit band</dt>
                <dd className="mt-1 text-sm font-semibold text-sidebar-accent-foreground">
                  {card.limitBand}
                </dd>
              </dl>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/auth">
                  <Button size="lg">Book this card</Button>
                </Link>
                <Link to="/">
                  <Button size="lg" variant="secondary">
                    Back to line-up
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-xl bg-white/95 p-6">
              <img
                src={card.image}
                alt={`${card.name} card face`}
                className="mx-auto h-56 w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-lg border bg-card p-6">
            <h2 className="text-sm font-semibold">Key features</h2>
            <ul className="mt-4 space-y-3">
              {card.features.map((f) => (
                <li key={f} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-lg border bg-card p-6">
            <h2 className="text-sm font-semibold">Eligibility highlights</h2>
            <ul className="mt-4 space-y-3">
              {card.eligibility.map((e) => (
                <li key={e} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {e}
                </li>
              ))}
            </ul>
          </article>
        </div>

        <h2 className="mt-14 text-lg font-semibold">Other cards</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((c) => (
            <Link
              key={c.slug}
              to="/cards/$slug"
              params={{ slug: c.slug }}
              className="card-tile overflow-hidden rounded-xl border bg-card"
            >
              <div className="bg-muted/60 p-5">
                <img
                  src={c.image}
                  alt={`${c.name} card face`}
                  loading="lazy"
                  className="mx-auto h-32 w-full rounded-lg object-contain"
                />
              </div>
              <div className="border-t p-5">
                <span className="field-label text-primary">{c.scheme}</span>
                <h3 className="mt-2 text-sm font-semibold">{c.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="brand-rule" />
      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        Card Operations · Internal use only
      </footer>
    </div>
  );
}
