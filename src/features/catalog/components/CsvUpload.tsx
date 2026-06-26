import { useRef, useState } from "react";
import { Button, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import sampleUrl from "@/shared/mocks/products_upload_sample.csv?url";

export interface ParsedRow {
  name: string;
  category: string;
  price: string;
  unit: string;
  stock: string;
  [key: string]: string;
}

/** Minimal CSV parser (handles simple comma-separated rows + header). */
function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: ParsedRow = {} as ParsedRow;
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

interface CsvUploadProps {
  onParsed?: (rows: ParsedRow[]) => void;
}

/**
 * Task 2 — CSV bulk product upload. Drag/drop or pick a file, preview the
 * parsed rows, then "import". Real import swaps to an API call later.
 */
export function CsvUpload({ onParsed }: CsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const [imported, setImported] = useState(false);

  function handleFile(file: File) {
    setFileName(file.name);
    setImported(false);
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result));
      setRows(parsed);
      onParsed?.(parsed);
    };
    reader.readAsText(file);
  }

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
          Columns: name, category, price, unit, stock, organic, traceable, tags, description
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

      {rows.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg border border-surface-highest">
          <div className="flex items-center justify-between bg-surface-low px-token-sm py-2">
            <p className="text-label-md font-semibold text-on-surface">
              <Icon name="description" size={16} className="mr-1 align-middle text-secondary" />
              {fileName} · {rows.length} products parsed
            </p>
            <Button
              size="sm"
              icon={imported ? "check" : "cloud_upload"}
              onClick={() => setImported(true)}
            >
              {imported ? "Imported" : `Import ${rows.length}`}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-highest">
                {rows.map((r, i) => (
                  <tr key={i} className="bg-surface-lowest">
                    <td className="px-token-sm py-2 font-medium text-on-surface">{r.name}</td>
                    <td className="px-token-sm py-2 text-on-surface-variant">{r.category}</td>
                    <td className="px-token-sm py-2 text-on-surface-variant">${r.price}</td>
                    <td className="px-token-sm py-2 text-on-surface-variant">{r.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
