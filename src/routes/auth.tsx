import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Sign In — CMS Middleware" },
      {
        name: "description",
        content:
          "Card Operations staff sign-in for the CBS ↔ Tranzware CMS middleware: maker, checker and administrator access.",
      },
      { property: "og:title", content: "Staff Sign In — CMS Middleware" },
      {
        property: "og:description",
        content: "Secure staff access to card onboarding and maker-checker workflows.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: String(form.get("full_name") ?? ""),
          employee_id: String(form.get("employee_id") ?? ""),
          designation: String(form.get("designation") ?? ""),
          branch: String(form.get("branch") ?? ""),
        },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      navigate({ to: "/dashboard", replace: true });
    } else {
      toast.success("Account created. Check your email to confirm, then sign in.");
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="hidden flex-col justify-between bg-sidebar px-10 py-12 text-sidebar-foreground lg:flex">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-sidebar-foreground/60">
            Mutual Trust Bank PLC
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-sidebar-accent-foreground">
            CBS ↔ Tranzware CMS
            <br />
            Middleware
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-sidebar-foreground/75">
            Single-point customer onboarding, end-to-end card booking, automated card number
            generation and dual-control approvals — with a complete audit trail.
          </p>
        </div>
        <ul className="space-y-3 text-sm text-sidebar-foreground/80">
          {[
            "Maker → Checker → Checker-1 → Checker-2 workflow",
            "Real-time CIF and Client ID synchronisation",
            "Primary, supplementary, business and prepaid cards",
            "Audit trail, data-change and authorisation reports",
          ].map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-sidebar-primary">▸</span>
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="field-label hover:text-foreground">
            ← Back
          </Link>
          <h2 className="mt-4 text-xl font-semibold">Card Operations access</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your bank email address. Roles are assigned by an administrator.
          </p>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="si-password">Password</Label>
                  <Input
                    id="si-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" name="full_name" required maxLength={100} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="su-emp">Employee ID</Label>
                    <Input id="su-emp" name="employee_id" maxLength={20} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-branch">Branch / Unit</Label>
                    <Input id="su-branch" name="branch" maxLength={60} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-desig">Designation</Label>
                  <Input id="su-desig" name="designation" maxLength={60} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-password">Password</Label>
                  <Input
                    id="su-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating account…" : "Register"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  The first registered user becomes Administrator. Everyone else needs a role
                  assigned in Users &amp; Roles before they can act.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}