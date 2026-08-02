import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bulkUploadRequests } from "@/lib/cms.functions";
import { formatDateTime } from "@/lib/cms-constants";

export const Route = createFileRoute("/_authenticated/bulk")({
  component: BulkUpload,
});

const TEMPLATE =
  "applicant_name,mobile,email,national_id,card_type,requested_limit,embossing_name,existing_cif\n" +
  "Rahim Uddin,01711000000,rahim@example.com,1990123456789,primary_credit,200000,RAHIM UDDIN,\n";

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("The file has no data rows");
  const headers = lines[0]!.split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

function BulkUpload() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const upload = useServerFn(bulkUploadRequests);

  const { data: batches } = useQuery({
    queryKey: ["bulk-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bulk_batches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const rows = parseCsv(await file.text());
      if (rows.length > 2000) throw new Error("Maximum 2000 rows per upload");
      const result = (await upload({ data: { fileName: file.name, rows } })) as {
        accepted?: number;
        rejected?: number;
      };
      toast.success(
        `Uploaded: ${result?.accepted ?? rows.length} accepted, ${result?.rejected ?? 0} rejected`,
      );
      queryClient.invalidateQueries({ queryKey: ["bulk-batches"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "card-booking-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Bulk upload"
        description="Upload multiple card bookings from a CSV file. Each accepted row becomes a draft case that still passes through the full maker-checker workflow."
        actions={
          <Button variant="outline" onClick={downloadTemplate}>
            Download template
          </Button>
        }
      />

      <section className="rounded-lg border bg-card p-5">
        <p className="field-label">CSV file</p>
        <Input
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          className="mt-2 max-w-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Required columns: applicant_name, mobile, card_type, requested_limit. Optional: email,
          national_id, embossing_name, existing_cif.
        </p>
      </section>

      <section className="mt-6 rounded-lg border bg-card">
        <h2 className="border-b px-4 py-3 text-sm font-semibold">Upload history</h2>
        {(batches ?? []).length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No uploads yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                {["File", "Total", "Accepted", "Rejected", "Uploaded"].map((h) => (
                  <th key={h} className="px-3 py-2.5 field-label">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {(batches ?? []).map((b) => (
                <tr key={b.id}>
                  <td className="px-3 py-2.5">{b.file_name}</td>
                  <td className="px-3 py-2.5 tabular-nums">{b.total_rows}</td>
                  <td className="px-3 py-2.5 tabular-nums text-emerald-600">{b.accepted_rows}</td>
                  <td className="px-3 py-2.5 tabular-nums text-destructive">{b.rejected_rows}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {formatDateTime(b.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}