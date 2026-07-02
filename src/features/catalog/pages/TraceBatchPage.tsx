import { useParams, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/ui";
import { supabase, type DbProduct } from "@/lib/supabase";

/**
 * QR landing route: the QR printed on a product label encodes
 * /trace/<batchId>. This resolves the batch number to its product
 * and redirects to the product passport.
 */
export function TraceBatchPage() {
  const { batchId } = useParams();

  const { data: product, isLoading } = useQuery({
    queryKey: ["trace", batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, batch_id")
        .eq("batch_id", batchId!)
        .maybeSingle();
      if (error) throw error;
      return data as Pick<DbProduct, "id" | "batch_id"> | null;
    },
    enabled: !!batchId,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-on-surface-variant">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
        <p className="text-body-md">Verifying batch {batchId}…</p>
      </div>
    );
  }

  if (product) {
    return <Navigate to={`/product/${product.id}/passport`} replace />;
  }

  return (
    <div className="container-page flex flex-col items-center py-token-lg text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-error-container text-error">
        <Icon name="search_off" size={32} />
      </span>
      <h1 className="mt-4 font-serif text-headline-lg font-semibold text-on-surface">
        Batch not found
      </h1>
      <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
        We couldn't find a product with batch number{" "}
        <span className="font-semibold text-on-surface">{batchId}</span>. The
        product may no longer be listed, or the code may have been mistyped.
      </p>
      <Link
        to="/shop"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-label-md font-semibold text-primary-on"
      >
        <Icon name="storefront" size={18} /> Browse the grid
      </Link>
    </div>
  );
}
