import { useRef, useState } from "react";
import { Button, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { useAddProduct } from "@/lib/hooks/useProducts";
import type { ProductCategory } from "@/shared/types";
import sampleUrl from "@/shared/mocks/products_upload_sample.csv?url";

export interface ParsedRow {
  name: string;
  category: string;
  price: string;
  unit: string;
  stock: string;
  [key: string]: string;
}

const CATEGORIES = new Set([
  "GROCERY","HONEY","OILS","GRAINS","TEXTILES","POTTERY","CRAFTS","DAIRY","SPICES","OTHER",
]);

/** Minimal CSV parser (handles simple comma-separated rows + header). */
function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: ParsedRow = {} as ParsedRow;
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

function rowError(r: ParsedRow): string | null {
  if (!r.name) return "missing name";
  if (!r.price || isNaN(parseFloat(r.price))) return "invalid price";
  if (r.category && !CATEGORIES.has(r.category.toUpperCase())) return `unknown category "${r.category}"`;
  return null;
}

interface CsvUploadProps {
  /** Seller the imported products belong to. Import is disabled without it. */
  sellerId?: string;
  onParsed?: (rows: ParsedRow[]) => void;
}

/**
 * CSV bulk product upload. Drag/drop or pick a file, preview the parsed rows,
 * then import straight into Supabase as PENDING_APPROVAL listings.
 */
export function CsvUpload({ sellerId, onParsed }: CsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addProduct = useAddProduct();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; failed: number; error?: string } | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result));
      setRows(parsed);
      onParsed?.(parsed);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!sellerId || rows.length === 0) return;
    setImporting(true);
    let ok = 0, failed = 0;
    let firstError: string | undefined;

    for (const r of rows) {
      if (rowError(r)) { failed++; continue; }
      const name      = r.name;
      const traceable = (r.traceable ?? "true").toLowerCase() !== "false";
      const initials  = name.split(/\s+/).map((w) => w[0]).join("").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
      try {
        await addProduct.mutateAsync({
          seller_id:   sellerId,
          name,
          description: r.description ?? "",
          tags:        (r.tags ?? "").split("|").map((t) => t.trim()).filter(Boolean),
          batch_id:    traceable
            ? `BG-${new Date().getFullYear()}-${initials || "PRD"}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`
            : null,
          price:       parseFloat(r.price),
          unit:        r.unit || "each",
          category:    (CATEGORIES.has((r.category ?? "").toUpperCase()) ? r.category.toUpperCase() : "OTHER") as ProductCategory,
          stock:       parseInt(r.stock) || 0,
          organic:     (r.organic ?? "").toLowerCase() === "true",
          traceable,
          status:      "PENDING_APPROVAL",
        });
        ok++;
      } catch (e) {
        failed++;
        firstError ??= e instanceof Error ? e.message : "insert failed";
      }
    }

    setImporting(false);
    setResult({ ok, failed, error: firstError });
    if (ok > 0 && failed === 0) setRows([]);
  }

  const invalidCount = rows.filter((r) => rowError(r)).length;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors",
          dragging ? "border-primary bg-primary-fixed/30" : "border-outline-variant bg-surface-low",
        )}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary-container text-secondary-on-container">
          <Icon name="upload_file" size={26} />
        </span>
        <p className="text-body-md font-medium text-on-surface">
          Drag a CSV here, or
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="ml-1 font-semibold text-primary underline-offset-2 hover:underline"
          >
            browse files
          </button>
        </p>
        <p className="text-label-sm text-on-surface-variant">
          Columns: name, category, price, unit, stock, organic, traceable, tags (| separated), description
        </p>
        <a href={sampleUrl} download="products_upload_sample.csv" className="mt-1 inline-flex items-center gap-1 text-label-md font-semibold text-secondary hover:text-primary">
          <Icon name="download" size={16} /> Download template
        </a>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {result && (
        <div className={cn(
          "mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-label-md",
          result.failed === 0 ? "bg-secondary-container/40 text-secondary-on-container" : "bg-error-container/40 text-error",
        )}>
          <Icon name={result.failed === 0 ? "check_circle" : "warning"} size={16} filled />
          {result.ok} product{result.ok !== 1 ? "s" : ""} imported (pending approval)
          {result.failed > 0 && ` · ${result.failed} failed${result.error ? ` — ${result.error}` : ""}`}
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg border border-surface-highest">
          <div className="flex items-center justify-between bg-surface-low px-token-sm py-2">
            <p className="text-label-md font-semibold text-on-surface">
              <Icon name="description" size={16} className="mr-1 align-middle text-secondary" />
              {fileName} · {rows.length} rows parsed
              {invalidCount > 0 && <span className="ml-1 text-error">({invalidCount} invalid, will be skipped)</span>}
            </p>
            <Button
              size="sm"
              icon={importing ? "hourglass_empty" : "cloud_upload"}
              disabled={importing || !sellerId || rows.length === invalidCount}
              onClick={handleImport}
            >
              {importing ? "Importing…" : `Import ${rows.length - invalidCount}`}
            </Button>
          </div>
          <div className="max-h-56 overflow-auto">
            <table className="w-full text-left text-label-md">
              <thead className="sticky top-0 bg-surface-container text-on-surface-variant">
                <tr>
                  <th className="px-token-sm py-2 font-semibold">Name</th>
                  <th className="px-token-sm py-2 font-semibold">Category</th>
                  <th className="px-token-sm py-2 font-semibold">Price</th>
                  <th className="px-token-sm py-2 font-semibold">Stock</th>
                  <th className="px-token-sm py-2 font-semibold">Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-highest">
                {rows.map((r, i) => {
                  const err = rowError(r);
                  return (
                    <tr key={i} className="bg-surface-lowest">
                      <td className="px-token-sm py-2 font-medium text-on-surface">{r.name || "—"}</td>
                      <td className="px-token-sm py-2 text-on-surface-variant">{r.category}</td>
                      <td className="px-token-sm py-2 text-on-surface-variant">
                        {isNaN(parseFloat(r.price)) ? r.price : formatPrice(parseFloat(r.price))}
                      </td>
                      <td className="px-token-sm py-2 text-on-surface-variant">{r.stock}</td>
                      <td className="px-token-sm py-2">
                        {err ? (
                          <span className="inline-flex items-center gap-1 text-label-sm text-error"><Icon name="error" size={13} /> {err}</span>
                        ) : (
                          <Icon name="check_circle" size={15} className="text-secondary" filled />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!sellerId && rows.length > 0 && (
        <p className="mt-2 text-label-sm text-error">No seller profile found — import is disabled.</p>
      )}
    </div>
  );
}
