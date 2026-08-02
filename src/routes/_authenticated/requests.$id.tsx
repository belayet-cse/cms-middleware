import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/mock/db";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approveRequestLimit,
  decideCardRequest,
  setRequestLimit,
  submitCardRequest,
} from "@/lib/mock/actions";
import {
  CARD_TYPES,
  FC_CATEGORIES,
  PAYMENT_INSTRUCTIONS,
  REQUEST_TYPES,
  formatAmount,
  formatDateTime,
  labelOf,
  maskCard,
} from "@/lib/cms-constants";

export const Route = createFileRoute("/_authenticated/requests/$id")({
  component: RequestDetail,
});

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className="mt-0.5 text-sm">{value ?? "—"}</p>
    </div>
  );
}

function RequestDetail() {
  const { id } = Route.useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState("");
  const [limit, setLimit] = useState("");
  const [cashPercent, setCashPercent] = useState("50");

  const submitFn = submitCardRequest;
  const decideFn = decideCardRequest;
  const setLimitFn = setRequestLimit;
  const approveLimitFn = approveRequestLimit;

  const { data, isLoading } = useQuery({
    queryKey: ["request", id],
    queryFn: async () => {
      const [request, approvals] = await Promise.all([
        supabase
          .from("card_requests")
          .select("*, card_products(product_name, product_code, scheme), fee_profiles(profile_name)")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("request_approvals")
          .select("*")
          .eq("request_id", id)
          .order("created_at", { ascending: true }),
      ]);
      if (request.error) throw request.error;
      return { request: request.data, approvals: approvals.data ?? [] };
    },
  });

  const request = data?.request;

  function afterAction(message: string) {
    toast.success(message);
    setRemarks("");
    queryClient.invalidateQueries({ queryKey: ["request", id] });
    queryClient.invalidateQueries({ queryKey: ["requests"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const action = useMutation({
    mutationFn: async (kind: "submit" | "approve" | "return" | "reject" | "limit" | "authorise") => {
      if (kind === "submit") return submitFn({ data: { id, remarks: remarks || undefined } });
      if (kind === "limit")
        return setLimitFn({
          data: {
            id,
            approvedLimit: Number(limit),
            cashLimitPercent: Number(cashPercent),
            remarks: remarks || undefined,
          },
        });
      if (kind === "authorise") return approveLimitFn({ data: { id, remarks: remarks || undefined } });
      return decideFn({
        data: {
          id,
          decision: kind === "approve" ? "approved" : kind === "return" ? "returned" : "rejected",
          remarks: remarks || undefined,
        },
      });
    },
    onSuccess: (_r, kind) => afterAction(`Request ${kind === "submit" ? "submitted" : "updated"} successfully`),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading request…</p>;
  if (!request)
    return (
      <div>
        <p className="text-sm text-muted-foreground">Request not found or not visible to your role.</p>
        <Link to="/requests" className="mt-3 inline-block text-sm text-primary hover:underline">
          Back to queue
        </Link>
      </div>
    );

  const isMakerStage = ["draft", "returned"].includes(request.status);
  const busy = action.isPending;

  return (
    <div>
      <PageHeader
        title={request.applicant_name}
        description={`${request.reference_no} · ${labelOf(REQUEST_TYPES, request.request_type)} · ${labelOf(CARD_TYPES, request.card_type)}`}
        actions={<StatusBadge status={request.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <section className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Customer & CIF</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Mobile" value={request.mobile} />
              <Field label="Email" value={request.email} />
              <Field label="National ID" value={request.national_id} />
              <Field label="Passport" value={request.passport_no} />
              <Field label="TIN" value={request.tin} />
              <Field label="Date of birth" value={request.date_of_birth} />
              <Field label="Father's name" value={request.father_name} />
              <Field label="Mother's name" value={request.mother_name} />
              <Field label="Company" value={request.company_name} />
              <Field
                label="CIF"
                value={
                  <span className="mono">
                    {request.generated_cif ?? request.existing_cif ?? "pending generation"}
                  </span>
                }
              />
              <Field
                label="CMS Client ID"
                value={<span className="mono">{request.generated_client_id ?? "pending"}</span>}
              />
              <Field
                label="Address"
                value={[request.address_line1, request.address_line2, request.city, request.postal_code]
                  .filter(Boolean)
                  .join(", ")}
              />
            </div>
          </section>

          <section className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Card & limit</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label="Product"
                value={
                  request.card_products
                    ? `${request.card_products.product_name} (${request.card_products.scheme})`
                    : "—"
                }
              />
              <Field label="Fee profile" value={request.fee_profiles?.profile_name} />
              <Field label="Embossing name" value={request.embossing_name} />
              <Field label="Requested limit" value={formatAmount(request.requested_limit)} />
              <Field
                label="Approved limit"
                value={request.approved_limit ? formatAmount(request.approved_limit) : "not set"}
              />
              <Field
                label="Card number"
                value={
                  <span className="mono">
                    {request.generated_card_number ? maskCard(request.generated_card_number) : "pending"}
                  </span>
                }
              />
              <Field
                label="Payment instruction"
                value={labelOf(PAYMENT_INSTRUCTIONS, request.payment_instruction)}
              />
              <Field label="FC category" value={labelOf(FC_CATEGORIES, request.fc_category)} />
              <Field label="FC account" value={request.fc_account_no} />
              <Field label="Email tagged" value={request.email_tagged ? "Yes" : "No"} />
              <Field label="SMS tagged" value={request.sms_tagged ? "Yes" : "No"} />
              <Field
                label="Credit shield"
                value={
                  request.credit_shield
                    ? `Yes${request.credit_shield_rate ? ` · ${request.credit_shield_rate}%` : ""}`
                    : "No"
                }
              />
            </div>
          </section>

          <section className="rounded-lg border bg-card">
            <h2 className="border-b px-4 py-3 text-sm font-semibold">Approval history</h2>
            {data!.approvals.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted-foreground">No actions recorded yet.</p>
            ) : (
              <ol className="divide-y">
                {data!.approvals.map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium capitalize">{a.action.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.actor_role ? `Role: ${a.actor_role}` : "—"}
                      {a.remarks ? ` · ${a.remarks}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold">Actions</h2>
            <div className="mt-3 space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Mandatory when returning or rejecting"
              />
            </div>

            <div className="mt-4 space-y-2">
              {isMakerStage && auth.canMake && (
                <Button className="w-full" disabled={busy} onClick={() => action.mutate("submit")}>
                  Submit to checker
                </Button>
              )}

              {request.status === "pending_checker" && auth.canCheck && (
                <>
                  <Button className="w-full" disabled={busy} onClick={() => action.mutate("approve")}>
                    Approve & generate card
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={busy}
                    onClick={() => action.mutate("return")}
                  >
                    Return to maker
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={busy}
                    onClick={() => action.mutate("reject")}
                  >
                    Reject
                  </Button>
                </>
              )}

              {request.status === "limit_pending_checker1" && auth.hasAnyRole(["checker1", "admin"]) && (
                <div className="space-y-2 rounded-md border bg-muted/40 p-3">
                  <p className="field-label">Checker-1 · set limit</p>
                  <div className="space-y-1.5">
                    <Label htmlFor="limit">Approved limit (BDT)</Label>
                    <Input
                      id="limit"
                      type="number"
                      min={0}
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      placeholder={String(request.requested_limit)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cash">Cash limit (% of card limit)</Label>
                    <Input
                      id="cash"
                      type="number"
                      min={0}
                      max={100}
                      value={cashPercent}
                      onChange={(e) => setCashPercent(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={busy || !limit}
                    onClick={() => action.mutate("limit")}
                  >
                    Set limit & send to Checker-2
                  </Button>
                </div>
              )}

              {request.status === "limit_pending_checker2" && auth.hasAnyRole(["checker2", "admin"]) && (
                <Button className="w-full" disabled={busy} onClick={() => action.mutate("authorise")}>
                  Authorise limit & sync
                </Button>
              )}

              {request.status === "completed" && (
                <p className="text-sm text-muted-foreground">
                  Case completed and synchronised with CBS and CMS.
                </p>
              )}

              {isMakerStage && auth.canMake && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate({ to: "/onboarding", search: { draft: id } })}
                >
                  Edit booking details
                </Button>
              )}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold">Case timeline</h2>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <p>Created: {formatDateTime(request.created_at)}</p>
              <p>Submitted: {formatDateTime(request.submitted_at)}</p>
              <p>Checked: {formatDateTime(request.checked_at)}</p>
              <p>Limit set: {formatDateTime(request.limit_checker1_at)}</p>
              <p>Limit authorised: {formatDateTime(request.limit_checker2_at)}</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}