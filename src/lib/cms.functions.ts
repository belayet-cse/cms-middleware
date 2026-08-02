import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const submitCardRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), remarks: z.string().max(1000).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { submitRequest } = await import("./cms/workflow.server");
    return submitRequest(context as never, data.id, data.remarks);
  });

export const decideCardRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "returned", "rejected"]),
        remarks: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { approveRequest, returnOrReject } = await import("./cms/workflow.server");
    if (data.decision === "approved") {
      return approveRequest(context as never, data.id, data.remarks);
    }
    if (!data.remarks || data.remarks.trim().length < 3) {
      throw new Error("Remarks are mandatory when returning or rejecting a request");
    }
    return returnOrReject(context as never, data.id, data.decision, data.remarks);
  });

export const setRequestLimit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        approvedLimit: z.number().min(0).max(100_000_000),
        cashLimitPercent: z.number().min(0).max(100),
        remarks: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { setCardLimit } = await import("./cms/workflow.server");
    return setCardLimit(context as never, data.id, data.approvedLimit, data.cashLimitPercent, data.remarks);
  });

export const approveRequestLimit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), remarks: z.string().max(1000).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { approveCardLimit } = await import("./cms/workflow.server");
    return approveCardLimit(context as never, data.id, data.remarks);
  });

export const changeCardStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        cardId: z.string().uuid(),
        status: z.enum(["active", "inactive", "blocked", "hotlisted", "closed", "expired"]),
        remarks: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { changeCardStatus } = await import("./cms/workflow.server");
    return changeCardStatus(context as never, data.cardId, data.status, data.remarks);
  });

export const createCardRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ payload: z.record(z.any()) }).parse(d))
  .handler(async ({ data, context }) => {
    const { createDraftRequest } = await import("./cms/draft.server");
    return createDraftRequest(context as never, data.payload);
  });

export const updateCardRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), payload: z.record(z.any()) }).parse(d))
  .handler(async ({ data, context }) => {
    const { updateDraftRequest } = await import("./cms/draft.server");
    return updateDraftRequest(context as never, data.id, data.payload);
  });

export const setUserRolesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        userId: z.string().uuid(),
        roles: z.array(z.enum(["admin", "maker", "checker1", "checker2", "auditor"])).max(5),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { setUserRoles } = await import("./cms/workflow.server");
    return setUserRoles(context as never, data.userId, data.roles);
  });

export const bulkUploadRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        fileName: z.string().min(1).max(200),
        rows: z.array(z.record(z.any())).max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { bulkCreateRequests } = await import("./cms/workflow.server");
    return bulkCreateRequests(context as never, data.fileName, data.rows as never);
  });

export const searchCbsCif = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ query: z.string().min(3).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { searchCif } = await import("./cms/draft.server");
    return searchCif(context as never, data.query);
  });